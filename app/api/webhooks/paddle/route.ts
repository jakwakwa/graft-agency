import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { webhookReceiptService } from "@/lib/services/webhook-receipt.service";
import type { Prisma } from "../../../../generated/prisma/client";

function verifyPaddleSignature(body: string, signature: string, secret: string): boolean {
  const parts = signature.split(";");
  let ts = "";
  let h1 = "";
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "ts") ts = value ?? "";
    if (key === "h1") h1 = value ?? "";
  }
  if (!ts || !h1) return false;

  const payload = `${ts}:${body}`;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  if (expected.length !== h1.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(h1, "hex"));
  } catch {
    return false;
  }
}

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
  if (!verifyPaddleSignature(body, signature, secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { event_type?: string; data?: unknown };
  try {
    payload = JSON.parse(body) as typeof payload;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const eventType = payload.event_type ?? "unknown";
    const receipt = await webhookReceiptService.recordVerifiedReceipt({
      eventId: resolvePaddleEventId(payload, body),
      eventType,
      payload: JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue,
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

function resolvePaddleEventId(payload: { event_id?: unknown; event_type?: string }, rawBody: string): string {
  return typeof payload.event_id === "string"
    ? payload.event_id
    : `${payload.event_type ?? "unknown"}:${createHash("sha256").update(rawBody).digest("hex")}`;
}
