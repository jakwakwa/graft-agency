import prisma from "@/lib/db/prisma";
import { RECONCILER_CRON_MIN_STALE_MS, shouldSkipJulesFetchInReconciler } from "@/lib/engagement/reconcile-throttle";
import { transitionStage } from "@/lib/engagement/stage-machine";
import { inngest } from "@/lib/inngest/client";
import {
  defaultJulesGithubSource,
  fetchLatestJulesProgressUpdate,
  getJulesSession,
  isJulesFailedState,
  isJulesTerminalState,
  julesProgressToDbFields,
  resolveJulesPullRequestUrl,
} from "@/lib/services/jules-github.service";
import { getRenderService } from "@/lib/services/render.service";

const NON_TERMINAL_STAGES = [
  "PENDING",
  "PROFILING",
  "PROFILED",
  "WRITING_PRD",
  "PRD_WRITTEN",
  "DESIGNING",
  "DESIGN_COMPLETE",
  "BUILDING",
  "BUILDING_COMPLETE",
] as const;

const ORCHESTRATOR_ONLY_STAGES = [
  "PROFILING",
  "PROFILED",
  "WRITING_PRD",
  "PRD_WRITTEN",
  "DESIGNING",
  "DESIGN_COMPLETE",
] as const;
const ORCHESTRATOR_STALE_MS = 5 * 60 * 1000; // 5 min

export const engagementReconcilerFunction = inngest.createFunction(
  {
    id: "engagement-reconciler",
    name: "Engagement Reconciler",
    retries: 3,
    concurrency: { limit: 4, key: "event.data.leadId" },
    triggers: [{ cron: "*/15 * * * *" }, { event: "engagement/reconcile.requested" }],
  },
  async ({ event, step }) => {
    // Scheduled cron mode: fan out per-lead reconcile events.
    if (!("leadId" in (event.data ?? {}))) {
      if (process.env.INNGEST_POLLING_ENABLED === "false") {
        return { skipped: true, reason: "polling-disabled" };
      }

      const stale = await step.run("find-stale-specs", () =>
        prisma.productSpec.findMany({
          where: {
            stage: { in: [...NON_TERMINAL_STAGES] },
            updatedAt: { lt: new Date(Date.now() - RECONCILER_CRON_MIN_STALE_MS) },
          },
          select: { leadId: true },
          take: 50,
        }),
      );

      if (stale.length > 0) {
        await step.sendEvent(
          "fan-out-reconcile",
          stale.map((s) => ({
            name: "engagement/reconcile.requested" as const,
            data: { leadId: s.leadId, reason: "scheduled-cron" },
          })),
        );
      }

      return { fannedOut: stale.length };
    }

    // Per-lead mode.
    const { leadId, reason, inngestRunId } = event.data as {
      leadId: string;
      reason?: string;
      inngestRunId?: string;
    };

    const spec = await step.run("load-spec", () =>
      prisma.productSpec.findUnique({
        where: { leadId },
        select: {
          stage: true,
          stageVersion: true,
          inngestRunStatus: true,
          updatedAt: true,
          julesSessionId: true,
          julesState: true,
          julesLastPolledAt: true,
          renderServiceId: true,
          deploymentUrl: true,
          pullRequestUrl: true,
          githubRepo: true,
        },
      }),
    );

    if (!spec) return { skipped: true, reason: "spec-not-found" };

    const { stage, stageVersion, updatedAt } = spec;
    const staleMs = Date.now() - new Date(updatedAt).getTime();

    // --- Orchestrator-only stages (no external system to query) ---
    if ((ORCHESTRATOR_ONLY_STAGES as readonly string[]).includes(stage)) {
      const inngestFailed = spec.inngestRunStatus === "Failed";
      const stale = staleMs > ORCHESTRATOR_STALE_MS;
      if (inngestFailed && stale) {
        const result = await step.run("mark-failed-orchestrator", () =>
          transitionStage({
            leadId,
            to: "FAILED",
            source: "reconciler",
            reason: `Orchestrator failed at ${stage} with no external system to query`,
            inngestRunId: inngestRunId ?? spec.inngestRunStatus ?? undefined,
            expectedStageVersion: stageVersion,
          }),
        );
        await step.run("mark-reconciled", () =>
          prisma.productSpec.update({
            where: { leadId },
            data: { lastReconciledAt: new Date(), lastReconciledBy: "reconciler" },
          }),
        );
        return { action: "marked-failed", stage, result };
      }

      await step.run("mark-reconciled", () =>
        prisma.productSpec.update({
          where: { leadId },
          data: { lastReconciledAt: new Date(), lastReconciledBy: "reconciler" },
        }),
      );
      return { action: "no-op", stage, reason: "not-stale-or-not-failed" };
    }

    // --- BUILDING: query Jules for authoritative state ---
    if (stage === "BUILDING") {
      if (!spec.julesSessionId) {
        await step.run("mark-reconciled", () =>
          prisma.productSpec.update({
            where: { leadId },
            data: { lastReconciledAt: new Date(), lastReconciledBy: "reconciler" },
          }),
        );
        return { action: "no-op", stage: "BUILDING", reason: "no-jules-session-id" };
      }

      const julesSessionId = spec.julesSessionId;

      if (shouldSkipJulesFetchInReconciler(spec.julesLastPolledAt)) {
        const lastPollIso = spec.julesLastPolledAt ? new Date(spec.julesLastPolledAt).toISOString() : null;
        return {
          action: "throttled-jules-fetch" as const,
          reason: "jules-polled-recently",
          julesLastPolledAt: lastPollIso,
        };
      }

      const julesSession = await step.run("fetch-jules-session", async () => {
        const session = await getJulesSession(julesSessionId);
        const progress = await fetchLatestJulesProgressUpdate(julesSessionId);
        return { session, progress };
      });

      const sessionState = julesSession.session.state;
      const progressFields = julesProgressToDbFields(julesSession.progress);

      if (!isJulesTerminalState(sessionState)) {
        // Still running — update Jules state metadata only.
        await step.run("update-jules-state", () =>
          prisma.productSpec.update({
            where: { leadId },
            data: {
              julesState: sessionState,
              julesLastPolledAt: new Date(),
              ...progressFields,
              lastReconciledAt: new Date(),
              lastReconciledBy: "reconciler",
            },
          }),
        );
        return { action: "still-running", julesState: sessionState };
      }

      if (isJulesFailedState(sessionState)) {
        const result = await step.run("mark-jules-failed", () =>
          transitionStage({
            leadId,
            to: "FAILED",
            source: "reconciler",
            reason: `Jules session ${julesSessionId} reached state ${sessionState}`,
            expectedStageVersion: stageVersion,
            data: {
              julesState: sessionState,
              julesLastPolledAt: new Date(),
              ...progressFields,
            },
          }),
        );
        await step.run("mark-reconciled", () =>
          prisma.productSpec.update({
            where: { leadId },
            data: {
              lastReconciledAt: new Date(),
              lastReconciledBy: "reconciler",
              failureSource: "JULES",
            },
          }),
        );
        return { action: "marked-failed", julesState: sessionState, result };
      }

      // Jules succeeded — promote to BUILDING_COMPLETE.
      const raw = julesSession.session.raw ?? {};
      const prUrl =
        spec.pullRequestUrl ??
        (await step.run("resolve-pr-url", () =>
          resolveJulesPullRequestUrl({
            raw,
            sessionId: julesSessionId,
            githubRepo: spec.githubRepo ?? defaultJulesGithubSource(),
          }),
        ));

      const result = await step.run("mark-building-complete", () =>
        transitionStage({
          leadId,
          to: "BUILDING_COMPLETE",
          source: "reconciler",
          reason: `Jules session ${julesSessionId} completed`,
          expectedStageVersion: stageVersion,
          data: {
            julesState: sessionState,
            julesLastPolledAt: new Date(),
            pullRequestUrl: prUrl ?? undefined,
            errorMessage: null,
            inngestRunStatus: "Completed",
            julesProgressTitle: null,
            julesProgressDescription: null,
          },
        }),
      );
      await step.run("mark-reconciled", () =>
        prisma.productSpec.update({
          where: { leadId },
          data: { lastReconciledAt: new Date(), lastReconciledBy: "reconciler" },
        }),
      );
      return { action: "promoted-building-complete", result };
    }

    // --- BUILDING_COMPLETE: resolve Render URL if missing ---
    if (stage === "BUILDING_COMPLETE") {
      if (spec.renderServiceId && !spec.deploymentUrl) {
        const renderService = await step.run("fetch-render-service", () => getRenderService(spec.renderServiceId!));
        if (renderService.serviceUrl) {
          await step.run("save-render-url", () =>
            prisma.productSpec.update({
              where: { leadId },
              data: {
                deploymentUrl: renderService.serviceUrl,
                lastReconciledAt: new Date(),
                lastReconciledBy: "reconciler",
              },
            }),
          );
          return { action: "resolved-render-url", url: renderService.serviceUrl };
        }
      }
      await step.run("mark-reconciled", () =>
        prisma.productSpec.update({
          where: { leadId },
          data: { lastReconciledAt: new Date(), lastReconciledBy: "reconciler" },
        }),
      );
      return { action: "no-op", stage: "BUILDING_COMPLETE" };
    }

    return { action: "no-op", stage, reason: "terminal-or-unhandled" };
  },
);
