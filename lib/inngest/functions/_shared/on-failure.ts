import type { EngagementStage } from "@/generated/prisma/client";
import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";

export type FailureSource =
  | "profiler"
  | "prd-writer"
  | "stitch-designer"
  | "jules-builder"
  | "jules-poller"
  | "offer-dispatcher";

// Intentionally does NOT transition stage to FAILED.
// External work (Jules, Stitch, Render) may still be running.
// The reconciler reads external system truth and decides the real outcome.
export function makeOnFailure(source: FailureSource, _stageOnEntry: EngagementStage) {
  return async ({
    event,
    error,
    runId,
  }: {
    event: {
      data: {
        leadId?: string;
        event?: {
          data?: {
            leadId?: string;
          };
        };
      };
    };
    error: { message: string };
    runId: string;
  }) => {
    const leadId = (event.data.leadId ?? event.data.event?.data?.leadId) as string | undefined;
    if (!leadId) return;

    await prisma.productSpec.updateMany({
      where: { leadId },
      data: {
        inngestRunId: runId,
        inngestRunStatus: "Failed",
        failureReason: error.message,
        failureSource: source.toUpperCase(),
      },
    });

    await inngest.send({
      name: "engagement/reconcile.requested",
      data: {
        leadId,
        reason: `${source} inngest run failed: ${error.message}`,
        inngestRunId: runId,
      },
    });
  };
}
