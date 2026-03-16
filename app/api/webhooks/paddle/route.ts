import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";

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

  let payload: { event_type?: string; data?: { custom_data?: { clientId?: string } } };
  try {
    payload = JSON.parse(body) as typeof payload;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.event_type !== "subscription.activated") {
    return Response.json({ received: true });
  }

  const clientId = payload.data?.custom_data?.clientId;
  if (!clientId) {
    return Response.json({ received: true, warning: "No clientId in custom_data" });
  }

  try {
    await prisma.client.update({
      where: { id: clientId },
      data: { subscriptionActive: true, subscriptionStatus: "active" },
    });
    return Response.json({ received: true, updated: clientId });
  } catch (err) {
    console.error("[Paddle webhook] Failed to update client:", err);
    return Response.json({ error: "Failed to update client" }, { status: 500 });
  }
}
