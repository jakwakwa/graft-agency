import type { NextRequest } from "next/server";
import { paddle } from "@/lib/paddle";
import { inngest } from "@/lib/inngest/client";
import { webhookReceiptService } from "@/lib/services/webhook-receipt.service";
import type { Prisma } from "../../../../generated/prisma/client";

export async function POST(req: NextRequest) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret || secret.length === 0) {
    return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const signature = req.headers.get("paddle-signature");
  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 401 });
  }

  const body = await req.text();

  let eventId: string;
  let eventType: string;
  try {
    const event = await paddle.webhooks.unmarshal(body, secret, signature);
    eventId = event.eventId;
    eventType = event.eventType;
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Prisma.InputJsonValue;
  try {
    payload = JSON.parse(body) as Prisma.InputJsonValue;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const receipt = await webhookReceiptService.recordVerifiedReceipt({
      eventId,
      eventType,
      payload,
      provider: "PADDLE",
    });

    if (!receipt.duplicate) {
      await inngest.send({
        name: "webhook/receipt.created",
        data: { receiptId: receipt.receiptId },
      });
    }

    return Response.json({ duplicate: receipt.duplicate, eventType, received: true }, { status: 202 });
  } catch (err) {
    console.error("[Paddle webhook] Failed to persist receipt:", err);
    return Response.json({ error: "Failed to persist webhook receipt" }, { status: 500 });
  }
}
