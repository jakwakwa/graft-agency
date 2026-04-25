import { z } from "zod";
import type { LeadStatus, Prisma } from "@/generated/prisma/client";
import { requirePlatformAccess } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requirePlatformAccess();
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  const { clientId } = result;

  const { id } = await params;
  const lead = await prisma.lead.findFirst({
    where: { id, clientId },
  });

  if (!lead) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(lead);
}

const LEAD_STATUSES = ["DRAFT_PENDING", "CONTACTED", "SCRAPED", "REPLIED", "BOOKED", "CLOSED"] as const;

const patchSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  scrapedData: z.record(z.string(), z.unknown()).optional(),
});

const toPrismaJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requirePlatformAccess();
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  const { clientId } = result;

  const { id } = await params;
  const existing = await prisma.lead.findFirst({
    where: { id, clientId },
  });

  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = patchSchema.safeParse(await req.json());
  if (!body.success) {
    return Response.json({ error: "Invalid request body", details: body.error.flatten() }, { status: 400 });
  }

  const data: { status?: LeadStatus; scrapedData?: Prisma.InputJsonValue } = {};
  if (body.data.status !== undefined) data.status = body.data.status as LeadStatus;
  if (body.data.scrapedData !== undefined) data.scrapedData = toPrismaJson(body.data.scrapedData);

  const lead = await prisma.lead.update({
    where: { id },
    data,
  });

  return Response.json(lead);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requirePlatformAccess();
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  const { clientId } = result;

  const { id } = await params;
  const lead = await prisma.lead.findFirst({
    where: { id, clientId },
    include: {
      productSpec: {
        select: { stage: true },
      },
    },
  });

  if (!lead) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const stage = lead.productSpec?.stage ?? "PENDING";
  if (stage !== "PENDING") {
    // If there is a product spec but it's not pending, we block deletion
    return Response.json(
      { error: "Cannot delete lead that has entered the pipeline" },
      { status: 409 },
    );
  }

  await prisma.$transaction([
    prisma.conversation.deleteMany({ where: { leadId: id } }),
    prisma.prospectQueue.deleteMany({ where: { leadId: id } }),
    // productSpec and stageTransitions are Cascade onDelete in the DB schema,
    // but explicit delete is safer if we're not 100% sure the DB reflects the schema perfectly.
    // However, Lead -> ProductSpec is cascade.
    prisma.lead.delete({ where: { id } }),
  ]);

  return new Response(null, { status: 204 });
}
