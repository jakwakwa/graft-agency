import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAccess } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
): Promise<NextResponse> {
  const authResult = await requirePlatformAccess();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  const { leadId } = await params;
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!lead.clientId) return NextResponse.json({ error: "Lead has no clientId" }, { status: 400 });

  // Optional operator inputs (same shape as the approve endpoint).
  let body: { engagementObjectives?: unknown; buildVariant?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // No JSON body.
  }
  const engagementObjectives =
    typeof body.engagementObjectives === "string" && body.engagementObjectives.trim()
      ? body.engagementObjectives.trim()
      : null;
  const buildVariant = body.buildVariant === "landing" || body.buildVariant === "campaign" ? body.buildVariant : null;

  if (engagementObjectives !== null || buildVariant !== null) {
    await prisma.productSpec.updateMany({
      where: { leadId },
      data: {
        ...(engagementObjectives !== null ? { engagementObjectives } : {}),
        ...(buildVariant !== null ? { buildVariant } : {}),
      },
    });
  }

  await inngest.send({
    name: "engagement/lead.approved",
    data: { leadId, clientId: lead.clientId, engagementObjectives, buildVariant },
  });

  return NextResponse.json({ ok: true, leadId, event: "engagement/lead.approved" });
}
