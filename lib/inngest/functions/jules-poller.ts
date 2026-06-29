import prisma from "@/lib/db/prisma";
import { slugFromCompanyName } from "@/lib/engagement/company-slug";
import { ensureRenderService } from "@/lib/engagement/idempotency";
import { transitionStage } from "@/lib/engagement/stage-machine";
import { inngest } from "@/lib/inngest/client";
import {
  approveJulesPlan,
  fetchGithubPullRequestHeadRef,
  fetchGithubPullRequestHeadSha,
  fetchLatestJulesProgressUpdate,
  findRenderPreviewUrl,
  getJulesSession,
  isJulesFailedState,
  isJulesTerminalState,
  julesProgressToDbFields,
  parseGithubPullRequestFromUrl,
  parseGithubRepoFromJulesSource,
  postGithubCommitStatus,
  resolveJulesPullRequestUrl,
} from "@/lib/services/jules-github.service";
import {
  canProvisionRenderService,
  getLatestRenderDeploy,
  getRenderService,
  isRenderDeploySuccess,
  isRenderDeployTerminal,
  updateRenderServiceBranch,
} from "@/lib/services/render.service";
import type { ProfiledNeeds } from "@/lib/types/engagement";
import { makeOnFailure } from "./_shared/on-failure";

/**
 * Polls the Jules session until it reaches a terminal state, then resolves the
 * downstream PR + Render preview URL. Drives the `BUILDING → BUILDING_COMPLETE`
 * (or `FAILED`) transition based on *real* Jules state.
 *
 * Cadence: ~60s between polls (Jules builds run ~10 min, no need to be eager).
 * This function intentionally re-queues itself instead of imposing a max poll
 * count so long-running Jules sessions do not get marked as FAILED just because
 * they exceeded an arbitrary timeout window.
 */
const POLL_INTERVAL_SECONDS = 60;

export const julesPollerFunction = inngest.createFunction(
  {
    id: "jules-poller",
    name: "Jules Build Poller",
    retries: 5,
    concurrency: { limit: 5 },
    onFailure: makeOnFailure("jules-poller", "BUILDING"),
    triggers: [{ event: "engagement/build.started" }, { event: "engagement/build.poll.tick" }],
  },
  async ({ event, step }) => {
    const { leadId, githubRepo, julesSessionId, pollCycle, renderServiceId } = event.data as {
      leadId: string;
      githubRepo: string;
      julesSessionId: string;
      pollCycle?: number;
      renderServiceId?: string;
    };

    if (!julesSessionId) {
      throw new Error(`jules-poller invoked without julesSessionId for lead ${leadId}`);
    }

    const repo = parseGithubRepoFromJulesSource(githubRepo);

    await step.sleep("wait-before-poll", `${POLL_INTERVAL_SECONDS}s`);

    const session = await step.run("poll-jules-session", async () => {
      const result = await getJulesSession(julesSessionId);
      const progress = await fetchLatestJulesProgressUpdate(julesSessionId);
      const progressFields = julesProgressToDbFields(progress);
      await prisma.productSpec.update({
        where: { leadId },
        data: {
          julesState: result.state,
          julesLastPolledAt: new Date(),
          ...progressFields,
        },
      });
      return { state: result.state };
    });

    if (session.state.toUpperCase() === "AWAITING_PLAN_APPROVAL") {
      await step.run("approve-jules-plan", async () => {
        await approveJulesPlan(julesSessionId);
      });
      if (process.env.INNGEST_POLLING_ENABLED !== "false") {
        await step.sendEvent("requeue-after-plan-approval", {
          name: "engagement/build.poll.tick",
          data: {
            leadId,
            githubRepo,
            julesSessionId,
            pollCycle: (pollCycle ?? 0) + 1,
          },
        });
      }
      return {
        leadId,
        outcome: process.env.INNGEST_POLLING_ENABLED === "false" ? ("paused" as const) : ("approved-plan" as const),
        julesState: session.state,
        pollCycle: (pollCycle ?? 0) + 1,
      };
    }

    if (!isJulesTerminalState(session.state)) {
      if (process.env.INNGEST_POLLING_ENABLED !== "false") {
        await step.sendEvent("requeue-poll", {
          name: "engagement/build.poll.tick",
          data: {
            leadId,
            githubRepo,
            julesSessionId,
            pollCycle: (pollCycle ?? 0) + 1,
          },
        });
      }
      return {
        leadId,
        outcome: process.env.INNGEST_POLLING_ENABLED === "false" ? ("paused" as const) : ("pending" as const),
        julesState: session.state,
        pollCycle: (pollCycle ?? 0) + 1,
      };
    }

    const finalState = session.state;

    if (isJulesFailedState(finalState)) {
      await step.run("mark-failed", () =>
        transitionStage({
          leadId,
          to: "FAILED",
          source: "jules-poller",
          reason: `Jules build ${finalState}. Session: ${julesSessionId}`,
          data: { errorMessage: `Jules build ${finalState}. Session: ${julesSessionId}` },
        }),
      );
      return { leadId, outcome: "failed" as const, finalState };
    }

    // Jules succeeded — resolve PR first, then provision Render on the PR head branch (code is not on `main` yet).
    let pullRequestUrl: string | null = null;
    let deploymentUrl: string | null = null;

    const completedSession = await step.run("fetch-session-outputs", () => getJulesSession(julesSessionId));
    pullRequestUrl = await step.run("resolve-pr-url", () =>
      resolveJulesPullRequestUrl({
        raw: completedSession.raw,
        sessionId: julesSessionId,
        githubRepo,
      }),
    );

    const prParsed = pullRequestUrl ? parseGithubPullRequestFromUrl(pullRequestUrl) : null;
    const prInBuildsRepo =
      prParsed &&
      repo &&
      prParsed.owner.toLowerCase() === repo.owner.toLowerCase() &&
      prParsed.repo.toLowerCase() === repo.repo.toLowerCase()
        ? prParsed
        : null;

    const prHeadBranch = prInBuildsRepo
      ? await step.run("fetch-pr-head-branch", () =>
          fetchGithubPullRequestHeadRef({
            owner: prInBuildsRepo.owner,
            repo: prInBuildsRepo.repo,
            number: prInBuildsRepo.number,
          }),
        )
      : null;

    if (prInBuildsRepo && prHeadBranch && canProvisionRenderService()) {
      await step.run("ensure-render-service-on-pr-branch", async () => {
        const before = await prisma.productSpec.findUnique({
          where: { leadId },
          select: { renderServiceId: true, profiledNeeds: true },
        });
        const hadServiceBefore = Boolean(before?.renderServiceId);
        const profiled = before?.profiledNeeds as ProfiledNeeds | null | undefined;
        const companyName = profiled?.companyName;
        if (!companyName) return;
        const companySlug = slugFromCompanyName(companyName);
        await ensureRenderService({
          leadId,
          companySlug,
          repoSource: githubRepo,
          rootDir: `prospects/${companySlug}`,
          branch: prHeadBranch,
        });
        if (hadServiceBefore) {
          const after = await prisma.productSpec.findUnique({
            where: { leadId },
            select: { renderServiceId: true },
          });
          if (after?.renderServiceId) {
            await updateRenderServiceBranch(after.renderServiceId, prHeadBranch);
          }
        }
      });
    }

    const specRender = await step.run("load-render-service-info", () =>
      prisma.productSpec.findUnique({
        where: { leadId },
        select: {
          renderServiceId: true,
          deploymentUrl: true,
        },
      }),
    );
    const effectiveRenderServiceId = renderServiceId ?? specRender?.renderServiceId ?? null;
    deploymentUrl = specRender?.deploymentUrl ?? null;

    if (!deploymentUrl && effectiveRenderServiceId && canProvisionRenderService()) {
      const renderService = await step.run("fetch-render-service", () => getRenderService(effectiveRenderServiceId));
      deploymentUrl = renderService.serviceUrl;
      if (deploymentUrl) {
        await step.run("persist-render-service-url", () =>
          prisma.productSpec.update({
            where: { leadId },
            data: { deploymentUrl },
          }),
        );
      }
    }

    // Poll Render deploy status and report back to GitHub so Jules CI-listen can react.
    if (prInBuildsRepo && effectiveRenderServiceId && canProvisionRenderService()) {
      const prHeadSha = await step.run("fetch-pr-head-sha", () =>
        fetchGithubPullRequestHeadSha({
          owner: prInBuildsRepo.owner,
          repo: prInBuildsRepo.repo,
          number: prInBuildsRepo.number,
        }),
      );

      if (prHeadSha) {
        await step.run("post-render-status-pending", () =>
          postGithubCommitStatus({
            owner: prInBuildsRepo.owner,
            repo: prInBuildsRepo.repo,
            sha: prHeadSha,
            state: "pending",
            context: "render/prospect-deploy",
            description: "Render deployment in progress…",
          }),
        );

        // Poll up to 10 × 60 s (10 min) for a terminal deploy status.
        let renderDeployStatus: string | null = null;
        for (let i = 0; i < 10; i++) {
          await step.sleep(`render-deploy-poll-wait-${i}`, "60s");
          const deploy = await step.run(`render-deploy-poll-${i}`, () =>
            getLatestRenderDeploy(effectiveRenderServiceId),
          );
          if (deploy && isRenderDeployTerminal(deploy.status)) {
            renderDeployStatus = deploy.status;
            break;
          }
        }

        if (renderDeployStatus !== null) {
          const succeeded = isRenderDeploySuccess(renderDeployStatus);
          await step.run("post-render-status-final", () =>
            postGithubCommitStatus({
              owner: prInBuildsRepo.owner,
              repo: prInBuildsRepo.repo,
              sha: prHeadSha,
              state: succeeded ? "success" : "failure",
              context: "render/prospect-deploy",
              description: succeeded
                ? "Render deployment succeeded"
                : `Render deployment failed (${renderDeployStatus})`,
              ...(deploymentUrl ? { targetUrl: deploymentUrl } : {}),
            }),
          );

          if (!succeeded) {
            await step.run("mark-render-failed", () =>
              transitionStage({
                leadId,
                to: "FAILED",
                source: "jules-poller",
                reason: `Render deployment failed with status: ${renderDeployStatus}`,
                data: { errorMessage: `Render deployment failed (${renderDeployStatus})` },
              }),
            );
            return { leadId, outcome: "render-failed" as const, renderDeployStatus };
          }
        }
      }
    }

    if (prInBuildsRepo && !deploymentUrl) {
      // Fallback: scan PR comments for an onrender.com URL.
      for (let i = 0; i < 5; i++) {
        await step.sleep(`render-wait-${i}`, "30s");
        const preview = await step.run(`find-render-${i}`, () =>
          findRenderPreviewUrl({
            owner: prInBuildsRepo.owner,
            repo: prInBuildsRepo.repo,
            prNumber: prInBuildsRepo.number,
          }),
        );
        if (preview) {
          deploymentUrl = preview;
          break;
        }
      }
    }

    await step.run("mark-complete", () =>
      transitionStage({
        leadId,
        to: "BUILDING_COMPLETE",
        source: "jules-poller",
        data: {
          pullRequestUrl: pullRequestUrl ?? undefined,
          deploymentUrl: deploymentUrl ?? undefined,
          errorMessage: null,
          inngestRunStatus: "Completed",
          julesProgressTitle: null,
          julesProgressDescription: null,
        },
      }),
    );

    // Bridge to the offer stage. The Render flow has no deploy webhook, so the
    // poller emits deployment.ready itself once a live URL exists. offer-dispatcher
    // is idempotent per leadId, so a duplicate emit from the reconciler is safe.
    if (deploymentUrl) {
      const clientId = await step.run("load-client-id", () =>
        prisma.productSpec
          .findUnique({ where: { leadId }, select: { clientId: true } })
          .then((s) => s?.clientId ?? ""),
      );
      await step.sendEvent("emit-deployment-ready", {
        name: "engagement/deployment.ready",
        data: { leadId, clientId, deploymentUrl },
      });
    }

    return {
      leadId,
      outcome: "success" as const,
      finalState,
      pullRequestUrl,
      deploymentUrl,
    };
  },
);
