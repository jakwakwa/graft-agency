import { z } from "zod";
import { requirePlatformAccess } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";
import type { CreateProspectQueueInput } from "@/lib/types/prospect-queue";

const createSchema = z.object({
  businessName: z.string().min(1).max(500),
  websiteUrl: z.string().url().max(2048),
  address: z.string().max(500).optional(),
});

export async function GET() {
  const result = await requirePlatformAccess();
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  const { clientId } = result;

  const items = await prisma.prospectQueue.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(items);
}

export async function POST(req: Request) {
  const result = await requirePlatformAccess();
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  const { clientId } = result;

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
