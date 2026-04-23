import type { EngagementStage, Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/db/prisma";

export type TransitionSource =
  | "profiler"
  | "prd-writer"
  | "stitch-designer"
  | "jules-builder"
  | "jules-poller"
  | "offer-dispatcher"
  | "reconciler"
  | "on-read"
  | "manual";

export const ALLOWED_TRANSITIONS: Record<EngagementStage, EngagementStage[]> = {
  PENDING: ["PROFILING", "FAILED"],
  PROFILING: ["PROFILED", "FAILED"],
  PROFILED: ["WRITING_PRD", "FAILED"],
  WRITING_PRD: ["PRD_WRITTEN", "FAILED"],
  PRD_WRITTEN: ["DESIGNING", "FAILED"],
  DESIGNING: ["DESIGN_COMPLETE", "FAILED"],
  DESIGN_COMPLETE: ["BUILDING", "FAILED"],
  BUILDING: ["BUILDING_COMPLETE", "FAILED"],
  BUILDING_COMPLETE: ["OFFER_SENT", "FAILED"],
  DEPLOYING: ["DEPLOYED", "FAILED"],
  DEPLOYED: ["OFFER_SENT", "FAILED"],
  OFFER_SENT: [],
  FAILED: ["PROFILING", "WRITING_PRD", "DESIGNING", "BUILDING"],
};

export type TransitionResult =
  | { ok: true; from: EngagementStage; to: EngagementStage; version: number }
  | { ok: false; reason: "invalid-transition" | "version-conflict" | "not-found"; current?: EngagementStage };

export interface TransitionArgs {
  leadId: string;
  to: EngagementStage;
  source: TransitionSource;
  reason?: string;
  inngestRunId?: string;
  expectedStageVersion?: number;
  data?: Prisma.ProductSpecUpdateInput;
}

export async function transitionStage(args: TransitionArgs): Promise<TransitionResult> {
  const { leadId, to, source, reason, inngestRunId, expectedStageVersion, data } = args;

  return prisma.$transaction(async (tx) => {
    const spec = await tx.productSpec.findUnique({
      where: { leadId },
      select: { id: true, stage: true, stageVersion: true },
    });

    if (!spec) return { ok: false, reason: "not-found" };

    const allowed = ALLOWED_TRANSITIONS[spec.stage];
    if (!allowed.includes(to)) {
      return { ok: false, reason: "invalid-transition", current: spec.stage };
    }

    if (expectedStageVersion !== undefined && spec.stageVersion !== expectedStageVersion) {
      return { ok: false, reason: "version-conflict", current: spec.stage };
    }

    const failureData: Prisma.ProductSpecUpdateInput =
      to === "FAILED"
        ? {
            failedStage: spec.stage,
            failedAt: new Date(),
            failureReason: reason ?? null,
            failureSource: source.toUpperCase(),
          }
        : {};

    await tx.productSpec.update({
      where: { id: spec.id },
      data: {
        stage: to,
        stageVersion: { increment: 1 },
        ...failureData,
        ...data,
      },
    });

    await tx.stageTransition.create({
      data: {
        productSpecId: spec.id,
        leadId,
        fromStage: spec.stage,
        toStage: to,
        source,
        reason: reason ?? null,
        inngestRunId: inngestRunId ?? null,
      },
    });

    return { ok: true, from: spec.stage, to, version: spec.stageVersion + 1 };
  });
}
