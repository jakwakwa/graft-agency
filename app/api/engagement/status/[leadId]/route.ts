import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requirePlatformAccess } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";

const STALE_THRESHOLD_MS = 90_000; // 90s

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
): Promise<NextResponse> {
  const authResult = await requirePlatformAccess();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  const { leadId } = await params;

  const [spec, lead] = await Promise.all([
    prisma.productSpec.findUnique({
      where: { leadId },
      select: {
        stage: true,
        stageVersion: true,
        profiledNeeds: true,
        prdContent: true,
        designConcepts: true,
        chosenDesign: true,
        githubRepo: true,
        githubIssueUrl: true,
        julesSessionId: true,
        julesState: true,
        julesLastPolledAt: true,
        renderServiceId: true,
        renderServiceName: true,
        pullRequestUrl: true,
        deploymentUrl: true,
        offerSentAt: true,
        errorMessage: true,
        failedStage: true,
        failedAt: true,
        failureReason: true,
        failureSource: true,
        inngestRunId: true,
        inngestRunStatus: true,
        lastReconciledAt: true,
        lastReconciledBy: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.lead.findUnique({
      where: { id: leadId },
      select: { status: true },
    }),
  ]);

  if (!spec) {
    return NextResponse.json({
      stage: "NOT_STARTED",
      leadStatus: lead?.status ?? null,
    });
  }

  const terminalStages = ["OFFER_SENT", "DEPLOYED", "FAILED"];
  const isNonTerminal = !terminalStages.includes(spec.stage);
  const staleMs = Date.now() - new Date(spec.updatedAt).getTime();
  const isStale = isNonTerminal && staleMs > STALE_THRESHOLD_MS;

  // On-read reconciliation: fire-and-forget when the spec is stale and non-terminal.
  // Don't await — keep the GET response fast.
  if (isStale) {
    inngest
      .send({
        name: "engagement/reconcile.requested",
        data: { leadId, reason: "on-read-stale" },
      })
      .catch(() => {
        // Silently swallow — reconciler is best-effort; don't fail the GET
      });
  }

  const failure =
    spec.failedStage && spec.failedAt
      ? {
          stage: spec.failedStage,
          at: spec.failedAt.toISOString(),
          reason: spec.failureReason ?? null,
          source: spec.failureSource ?? null,
        }
      : null;

  return NextResponse.json({
    ...spec,
    leadStatus: lead?.status ?? null,
    isStale,
    failure,
    externalSystemStatus: {
      jules: spec.julesSessionId
        ? {
            state: spec.julesState ?? null,
            lastPolledAt: spec.julesLastPolledAt?.toISOString() ?? null,
          }
        : undefined,
      render: spec.renderServiceId
        ? {
            hasService: true,
            hasUrl: Boolean(spec.deploymentUrl),
          }
        : undefined,
    },
  });
}
