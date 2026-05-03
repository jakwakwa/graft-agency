import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { webhookReceiptService } from "@/lib/services/webhook-receipt.service";
import type { Prisma } from "../../../../generated/prisma/client";

function verifyCalSignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret || secret.length === 0) {
    return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const signature = req.headers.get("cal-signature");
  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 401 });
  }

  const body = await req.text();
  if (!verifyCalSignature(body, signature, secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { triggerEvent?: string; payload?: { uid?: string } };
  try {
    payload = JSON.parse(body) as typeof payload;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const eventType = payload.triggerEvent ?? "unknown";
    const receipt = await webhookReceiptService.recordVerifiedReceipt({
      eventId: resolveCalEventId(payload, body),
      eventType,
      payload: JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue,
      provider: "CAL",
    });

    if (!receipt.duplicate) {
      await inngest.send({
        name: "webhook/receipt.created",
        data: { receiptId: receipt.receiptId },
      });
    }

    return Response.json({ duplicate: receipt.duplicate, eventType, received: true }, { status: 202 });
  } catch (err) {
    console.error("[Cal webhook] Failed to persist receipt:", err);
    return Response.json({ error: "Failed to persist webhook receipt" }, { status: 500 });
  }
}

function resolveCalEventId(payload: { payload?: { uid?: string }; triggerEvent?: string }, rawBody: string): string {
  if (payload.payload?.uid) {
    return `${payload.triggerEvent ?? "unknown"}:${payload.payload.uid}`;
  }
  return `${payload.triggerEvent ?? "unknown"}:${createHash("sha256").update(rawBody).digest("hex")}`;
}
