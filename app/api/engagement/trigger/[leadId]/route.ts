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

  await inngest.send({
    name: "engagement/lead.approved",
    data: { leadId, clientId: lead.clientId },
  });

  return NextResponse.json({ ok: true, leadId, event: "engagement/lead.approved" });
}
