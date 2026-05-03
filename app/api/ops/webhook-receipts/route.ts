import { z } from "zod";
import { requirePlatformOwnerAccess } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";

const replaySchema = z.object({
  receiptId: z.string().min(1),
});

const providerSchema = z.enum(["CAL", "CLERK", "PADDLE", "VERCEL"]);
const statusSchema = z.enum(["FAILED", "PENDING", "PROCESSED", "PROCESSING"]);

export async function GET(req: Request) {
  const access = await requirePlatformOwnerAccess();
  if ("error" in access) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const provider = url.searchParams.get("provider");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);
  const parsedProvider = provider ? providerSchema.safeParse(provider.toUpperCase()) : null;
  const parsedStatus = status ? statusSchema.safeParse(status.toUpperCase()) : null;

  if (parsedProvider && !parsedProvider.success) {
    return Response.json({ error: "Invalid provider" }, { status: 400 });
  }
  if (parsedStatus && !parsedStatus.success) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const receipts = await prisma.webhookReceipt.findMany({
    orderBy: { receivedAt: "desc" },
    take: Number.isFinite(limit) ? limit : 50,
    where: {
      ...(parsedProvider?.success ? { provider: parsedProvider.data } : {}),
      ...(parsedStatus?.success ? { status: parsedStatus.data } : {}),
    },
  });

  return Response.json({ receipts });
}

export async function POST(req: Request) {
  const access = await requirePlatformOwnerAccess();
  if ("error" in access) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const body = replaySchema.safeParse(payload);
  if (!body.success) {
    return Response.json({ error: "Invalid request body", details: body.error.flatten() }, { status: 400 });
  }

  const receipt = await prisma.webhookReceipt.findUnique({
    where: { id: body.data.receiptId },
    select: { id: true },
  });
  if (!receipt) {
    return Response.json({ error: "Receipt not found" }, { status: 404 });
  }

  try {
    await prisma.webhookReceipt.update({
      where: { id: receipt.id },
      data: {
        errorMessage: null,
        status: "PENDING",
      },
    });
    await inngest.send({
      name: "webhook/receipt.created",
      data: { receiptId: receipt.id },
    });
  } catch (err) {
    console.error("[Webhook replay] Failed to enqueue receipt:", err);
    return Response.json({ error: "Failed to replay receipt" }, { status: 500 });
  }

  return Response.json({ queued: true, receiptId: receipt.id });
}
