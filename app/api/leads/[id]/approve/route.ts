import { requirePlatformAccess } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requirePlatformAccess();
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  const { clientId } = result;

  const { id } = await params;
  const lead = await prisma.lead.findFirst({
    where: { id, clientId, source: "OUTBOUND_PROSPECT" },
  });

  if (!lead) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (lead.status === "CONTACTED") {
    return Response.json({ error: "Lead already approved" }, { status: 400 });
  }

  if (lead.status !== "DRAFT_PENDING") {
    return Response.json({ error: `Cannot approve lead with status ${lead.status}` }, { status: 400 });
  }

  const updated = await prisma.lead.update({
    where: { id },
    data: { status: "CONTACTED" },
  });

  return Response.json({ success: true, lead: updated });
}
