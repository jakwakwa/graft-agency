import { z } from "zod";
import type { LeadStatus, Prisma } from "@/generated/prisma/client";
import { resolveClientIdFromAuth } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";

const LEAD_STATUSES = ["DRAFT_PENDING", "CONTACTED", "SCRAPED", "REPLIED", "BOOKED", "CLOSED"] as const;

const patchSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  scrapedData: z.record(z.string(), z.unknown()).optional(),
});

const toPrismaJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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
