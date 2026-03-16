import { z } from "zod";
import type { QueueStatus } from "@/generated/prisma/client";
import { resolveClientIdFromAuth } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";
import { VALID_QUEUE_STATUS_TRANSITIONS } from "@/lib/types/prospect-queue";

const patchSchema = z.object({
  businessName: z.string().min(1).max(500).optional(),
  websiteUrl: z.string().url().max(2048).optional(),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELED"] as const).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.prospectQueue.findFirst({
    where: { id, clientId },
  });

  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = patchSchema.safeParse(await req.json());
  if (!body.success) {
    return Response.json({ error: "Invalid request body", details: body.error.flatten() }, { status: 400 });
  }

  if (body.data.status !== undefined) {
    const allowed = VALID_QUEUE_STATUS_TRANSITIONS[existing.status as QueueStatus];
    if (!allowed.includes(body.data.status as QueueStatus)) {
      return Response.json(
        { error: `Invalid status transition from ${existing.status} to ${body.data.status}` },
        { status: 400 },
      );
    }
  }

  const item = await prisma.prospectQueue.update({
    where: { id },
    data: body.data,
  });

  return Response.json(item);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.prospectQueue.findFirst({
    where: { id, clientId },
  });

  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.prospectQueue.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
