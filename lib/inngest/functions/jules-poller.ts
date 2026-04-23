import prisma from "@/lib/db/prisma";
import { transitionStage } from "@/lib/engagement/stage-machine";
import { inngest } from "@/lib/inngest/client";
import { makeOnFailure } from "./_shared/on-failure";
import {
  approveJulesPlan,
  extractPullRequestUrlFromSession,
  findJulesPullRequest,
  findRenderPreviewUrl,
  getJulesSession,
  isJulesFailedState,
  isJulesTerminalState,
  parseGithubRepoFromJulesSource,
} from "@/lib/services/jules-github.service";
import { canProvisionRenderService, getRenderService } from "@/lib/services/render.service";

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
    concurrency: { limit: 20 },
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
      await prisma.productSpec.update({
        where: { leadId },
        data: {
          julesState: result.state,
          julesLastPolledAt: new Date(),
        },
      });
      return { state: result.state };
    });

    if (session.state.toUpperCase() === "AWAITING_PLAN_APPROVAL") {
      await step.run("approve-jules-plan", async () => {
        await approveJulesPlan(julesSessionId);
      });
      await step.sendEvent("requeue-after-plan-approval", {
        name: "engagement/build.poll.tick",
        data: {
          leadId,
          githubRepo,
          julesSessionId,
          pollCycle: (pollCycle ?? 0) + 1,
        },
      });
      return {
        leadId,
        outcome: "approved-plan" as const,
        julesState: session.state,
        pollCycle: (pollCycle ?? 0) + 1,
      };
    }

    if (!isJulesTerminalState(session.state)) {
      await step.sendEvent("requeue-poll", {
        name: "engagement/build.poll.tick",
        data: {
          leadId,
          githubRepo,
          julesSessionId,
          pollCycle: (pollCycle ?? 0) + 1,
        },
      });
      return {
        leadId,
        outcome: "pending" as const,
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

    // Jules succeeded — try to resolve the PR and Render preview.
    let pullRequestUrl: string | null = null;
    let deploymentUrl: string | null = null;

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

    const completedSession = await step.run("fetch-session-outputs", () => getJulesSession(julesSessionId));
    pullRequestUrl = extractPullRequestUrlFromSession(completedSession.raw);

    if (repo) {
      const pr = await step.run("find-pr", () =>
        findJulesPullRequest({ owner: repo.owner, repo: repo.repo, sessionId: julesSessionId }),
      );

      if (pr) {
        pullRequestUrl = pr.htmlUrl;

        if (!deploymentUrl) {
          // Fallback for repos where Render preview URLs are only posted on PR comments.
          for (let i = 0; i < 5; i++) {
            await step.sleep(`render-wait-${i}`, "30s");
            const preview = await step.run(`find-render-${i}`, () =>
              findRenderPreviewUrl({ owner: repo.owner, repo: repo.repo, prNumber: pr.number }),
            );
            if (preview) {
              deploymentUrl = preview;
              break;
            }
          }
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
        },
      }),
    );

    return {
      leadId,
      outcome: "success" as const,
      finalState,
      pullRequestUrl,
      deploymentUrl,
    };
  },
);
