import { requirePlatformAccess } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";

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

  if (lead.status !== "DRAFT_PENDING" && lead.status !== "CONTACTED") {
    return Response.json({ error: `Cannot approve lead with status ${lead.status}` }, { status: 400 });
  }

  // Atomic check-and-emit: acquire a row lock on the lead inside a transaction
  // so rapid double-clicks or duplicate events cannot both pass the canStart check
  // and fire two parallel pipelines (which is what caused "Unbroken" to run twice).
  const { pipelineStarted, stage } = await prisma.$transaction(async (tx) => {
    // Row-lock the lead so concurrent approvals queue behind this transaction.
    await tx.$executeRaw`SELECT id FROM leads WHERE id = ${id} FOR UPDATE`;

    if (lead.status === "DRAFT_PENDING") {
      await tx.lead.update({ where: { id }, data: { status: "CONTACTED" } });
    }

    const spec = await tx.productSpec.findUnique({
      where: { leadId: id },
      select: { stage: true },
    });

    const canStart = !spec || spec.stage === "PENDING";
    if (canStart) {
      // Create / ensure PENDING spec in the same transaction so the next
      // concurrent request sees a non-null, non-PENDING stage and no-ops.
      await tx.productSpec.upsert({
        where: { leadId: id },
        create: { leadId: id, clientId, stage: "PENDING" },
        update: {},
      });
    }

    return { pipelineStarted: canStart, stage: spec?.stage ?? "PENDING" };
  });

  // Emit after transaction commits so the spec row is visible to the handler.
  if (pipelineStarted) {
    await inngest.send({
      name: "engagement/lead.approved",
      data: { leadId: id, clientId },
    });
  }

  return Response.json({
    success: true,
    leadId: id,
    pipelineStarted,
    stage,
  });
}
