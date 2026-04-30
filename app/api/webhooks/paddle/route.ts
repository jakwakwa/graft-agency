import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
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

type SubscriptionData = {
  id: string;
  status: string;
  customer_id?: string;
  custom_data?: { clientId?: string };
  items?: Array<{ price: { id: string }; quantity: number }>;
};

type TransactionData = {
  id: string;
  status: string;
  custom_data?: { leadId?: string; productSpecId?: string; clientId?: string };
};

const ADDON_PRICE_IDS = [
  process.env.PADDLE_PRICE_VOICE_MONTHLY,
  process.env.PADDLE_PRICE_BOOKING_MONTHLY,
].filter(Boolean) as string[];

async function handleSubscriptionActivated(data: SubscriptionData) {
  const clientId = data.custom_data?.clientId;
  if (!clientId) return { warning: "No clientId in custom_data" };

  await prisma.client.update({
    where: { id: clientId },
    data: {
      subscriptionActive: true,
      subscriptionStatus: "active",
      paddleSubscriptionId: data.id,
    },
  });
  return { updated: clientId };
}

async function handleSubscriptionUpdated(data: SubscriptionData) {
  const clientId = data.custom_data?.clientId;
  if (!clientId) return { warning: "No clientId in custom_data" };

  const activeAddons = (data.items ?? [])
    .map((item) => item.price.id)
    .filter((id) => ADDON_PRICE_IDS.includes(id));

  await prisma.client.update({
    where: { id: clientId },
    data: {
      subscriptionStatus: data.status,
      subscriptionAddons: activeAddons,
    },
  });
  return { updated: clientId, addons: activeAddons };
}

async function handleSubscriptionCanceled(data: SubscriptionData) {
  const clientId = data.custom_data?.clientId;
  if (!clientId) return { warning: "No clientId in custom_data" };

  await prisma.client.update({
    where: { id: clientId },
    data: {
      subscriptionActive: false,
      subscriptionStatus: "canceled",
      subscriptionAddons: [],
    },
  });
  return { updated: clientId };
}

async function handleSubscriptionPaused(data: SubscriptionData) {
  const clientId = data.custom_data?.clientId;
  if (!clientId) return { warning: "No clientId in custom_data" };

  await prisma.client.update({
    where: { id: clientId },
    data: { subscriptionStatus: "paused", subscriptionActive: false },
  });
  return { updated: clientId };
}

async function handleSubscriptionPastDue(data: SubscriptionData) {
  const clientId = data.custom_data?.clientId;
  if (!clientId) return { warning: "No clientId in custom_data" };

  await prisma.client.update({
    where: { id: clientId },
    data: { subscriptionStatus: "past_due" },
  });
  return { updated: clientId };
}

async function handleTransactionCompleted(data: TransactionData) {
  const { productSpecId } = data.custom_data ?? {};
  if (!productSpecId) return { warning: "No productSpecId in custom_data" };

  await prisma.productSpec.update({
    where: { id: productSpecId },
    data: { stage: "OFFER_SENT" },
  });
  return { updated: productSpecId };
}

async function handleTransactionPaymentFailed(data: TransactionData) {
  const { productSpecId, clientId } = data.custom_data ?? {};
  console.error("[Paddle] Transaction payment failed:", { transactionId: data.id, productSpecId, clientId });
  return { logged: data.id };
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

  const eventType = payload.event_type;
  const data = payload.data;

  try {
    let result: unknown;

    switch (eventType) {
      case "subscription.activated":
        result = await handleSubscriptionActivated(data as SubscriptionData);
        break;
      case "subscription.updated":
        result = await handleSubscriptionUpdated(data as SubscriptionData);
        break;
      case "subscription.canceled":
        result = await handleSubscriptionCanceled(data as SubscriptionData);
        break;
      case "subscription.paused":
        result = await handleSubscriptionPaused(data as SubscriptionData);
        break;
      case "subscription.past_due":
        result = await handleSubscriptionPastDue(data as SubscriptionData);
        break;
      case "transaction.completed":
        result = await handleTransactionCompleted(data as TransactionData);
        break;
      case "transaction.payment_failed":
        result = await handleTransactionPaymentFailed(data as TransactionData);
        break;
      default:
        return Response.json({ received: true, eventType });
    }

    return Response.json({ received: true, eventType, result });
  } catch (err) {
    console.error(`[Paddle webhook] Handler failed for ${eventType}:`, err);
    return Response.json({ error: "Handler failed" }, { status: 500 });
  }
}
