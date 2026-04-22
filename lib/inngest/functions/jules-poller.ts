import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";
import {
  findJulesPullRequest,
  findRenderPreviewUrl,
  getJulesSession,
  isJulesFailedState,
  isJulesTerminalState,
  parseGithubRepoFromJulesSource,
} from "@/lib/services/jules-github.service";

/**
 * Polls the Jules session until it reaches a terminal state, then resolves the
 * downstream PR + Render preview URL. Drives the `BUILDING → BUILDING_COMPLETE`
 * (or `FAILED`) transition based on *real* Jules state.
 *
 * Cadence: ~60s between polls (Jules builds run ~10 min, no need to be eager).
 * Max wall-clock: 30 min. If we still don't have a terminal state by then we
 * mark the run as FAILED with a timeout message — the session URL remains
 * visible in the dashboard for manual inspection.
 */
const POLL_INTERVAL_SECONDS = 60;
const MAX_POLL_ATTEMPTS = 30; // 30 * 60s = 30 min

export const julesPollerFunction = inngest.createFunction(
  {
    id: "jules-poller",
    name: "Jules Build Poller",
    triggers: [{ event: "engagement/build.started" }],
    concurrency: { limit: 20 },
  },
  async ({ event, step }) => {
    const { leadId, githubRepo, julesSessionId } = event.data as {
      leadId: string;
      githubRepo: string;
      julesSessionId: string;
    };

    if (!julesSessionId) {
      throw new Error(`jules-poller invoked without julesSessionId for lead ${leadId}`);
    }

    const repo = parseGithubRepoFromJulesSource(githubRepo);

    let finalState: string | null = null;

    for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
      await step.sleep(`wait-${attempt}`, `${POLL_INTERVAL_SECONDS}s`);

      const session = await step.run(`poll-${attempt}`, async () => {
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

      if (isJulesTerminalState(session.state)) {
        finalState = session.state;
        break;
      }
    }

    if (!finalState) {
      await step.run("mark-timeout", () =>
        prisma.productSpec.update({
          where: { leadId },
          data: {
            stage: "FAILED",
            errorMessage: `Jules session did not reach a terminal state after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_SECONDS}s (last state: pending). Session: ${julesSessionId}`,
          },
        }),
      );
      return { leadId, outcome: "timeout" as const };
    }

    if (isJulesFailedState(finalState)) {
      await step.run("mark-failed", () =>
        prisma.productSpec.update({
          where: { leadId },
          data: {
            stage: "FAILED",
            errorMessage: `Jules build ${finalState}. Session: ${julesSessionId}`,
          },
        }),
      );
      return { leadId, outcome: "failed" as const, finalState };
    }

    // Jules succeeded — try to resolve the PR and Render preview.
    let pullRequestUrl: string | null = null;
    let deploymentUrl: string | null = null;

    if (repo) {
      const pr = await step.run("find-pr", () =>
        findJulesPullRequest({ owner: repo.owner, repo: repo.repo, sessionId: julesSessionId }),
      );

      if (pr) {
        pullRequestUrl = pr.htmlUrl;

        // Render posts its preview URL as a PR comment shortly after the PR opens.
        // Try a handful of times with short backoffs rather than bloating poll loops.
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

    await step.run("mark-complete", () =>
      prisma.productSpec.update({
        where: { leadId },
        data: {
          stage: "BUILDING_COMPLETE",
          pullRequestUrl: pullRequestUrl ?? undefined,
          deploymentUrl: deploymentUrl ?? undefined,
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
