import { z } from "zod";
import { resolveClientIdFromAuth } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";
import type { CreateProspectQueueInput } from "@/lib/types/prospect-queue";

const createSchema = z.object({
  businessName: z.string().min(1).max(500),
  websiteUrl: z.string().url().max(2048),
  address: z.string().max(500).optional(),
});

export async function GET() {
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.prospectQueue.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(items);
}

export async function POST(req: Request) {
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = createSchema.safeParse(await req.json());
  if (!body.success) {
    return Response.json({ error: "Invalid request body", details: body.error.flatten() }, { status: 400 });
  }

  const input: CreateProspectQueueInput = body.data;
  const item = await prisma.prospectQueue.create({
    data: {
      clientId,
      businessName: input.businessName,
      websiteUrl: input.websiteUrl,
    },
  });

  return Response.json(item, { status: 201 });
}
