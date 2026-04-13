import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAccess } from "@/lib/auth/guards";
import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
): Promise<NextResponse> {
  const authResult = await requirePlatformAccess();
  if (!authResult.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
