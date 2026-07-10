import type { NextRequest } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { paddle } from "@/lib/paddle";
import { webhookReceiptService } from "@/lib/services/webhook-receipt.service";
import { verifyPaddleSourceIp } from "@/lib/webhooks/paddle-ip-allowlist";
import type { Prisma } from "../../../../generated/prisma/client";

function getClientIp(req: NextRequest): string | null {
  return req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret || secret.length === 0) {
    return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // Only accept deliveries from Paddle's published live IPs. Sandbox is
  // exempt because local testing goes through tunnels that rewrite the source.
  if (process.env.PADDLE_ENVIRONMENT === "production") {
    const verdict = await verifyPaddleSourceIp(getClientIp(req));
    if (verdict === "denied") {
      return Response.json({ error: "Source IP not allowed" }, { status: 403 });
    }
    if (verdict === "unavailable") {
      // Allowlist never loaded — 503 so Paddle retries rather than dropping the event.
      return Response.json({ error: "IP allowlist unavailable" }, { status: 503 });
    }
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
