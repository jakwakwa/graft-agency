import prisma from "@/lib/db/prisma";

type SubscriptionData = {
  custom_data?: { clientId?: string };
  customer_id?: string;
  id: string;
  items?: Array<{ price: { id: string }; quantity: number }>;
  status: string;
};

type TransactionData = {
  custom_data?: { clientId?: string; leadId?: string; productSpecId?: string };
  id: string;
  status: string;
};

interface PaddleWebhookPayload {
  data?: unknown;
  event_type?: string;
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

function getAddonPriceIds(): string[] {
  return [process.env.PADDLE_PRICE_VOICE_MONTHLY, process.env.PADDLE_PRICE_BOOKING_MONTHLY].filter(Boolean) as string[];
}

function isSubscriptionData(data: unknown): data is SubscriptionData {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return false;
  const record = data as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.status === "string";
}

function isTransactionData(data: unknown): data is TransactionData {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return false;
  const record = data as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.status === "string";
}

async function handleSubscriptionActivated(data: SubscriptionData) {
  return syncSubscription(data, {
    includeAddons: true,
    status: data.status,
  });
}

async function handleSubscriptionUpdated(data: SubscriptionData) {
  return syncSubscription(data, {
    includeAddons: true,
    status: data.status,
  });
}

async function handleSubscriptionCanceled(data: SubscriptionData) {
  return syncSubscription(data, {
    clearAddons: true,
    status: "canceled",
  });
}

async function handleSubscriptionPaused(data: SubscriptionData) {
  return syncSubscription(data, {
    status: "paused",
  });
}

async function handleSubscriptionPastDue(data: SubscriptionData) {
  return syncSubscription(data, {
    status: "past_due",
  });
}

async function resolveSubscriptionClientId(data: SubscriptionData): Promise<string> {
  const clientId = data.custom_data?.clientId;
  if (clientId) return clientId;

  const client = await prisma.client.findFirst({
    select: { id: true },
    where: { paddleSubscriptionId: data.id },
  });
  if (!client) {
    throw new Error(`Unable to resolve Paddle subscription ${data.id} to a client`);
  }

  return client.id;
}

async function syncSubscription(
  data: SubscriptionData,
  options: { clearAddons?: boolean; includeAddons?: boolean; status: string },
) {
  const clientId = await resolveSubscriptionClientId(data);
  const activeAddons = (data.items ?? []).map((item) => item.price.id).filter((id) => getAddonPriceIds().includes(id));

  await prisma.client.update({
    where: { id: clientId },
    data: {
      ...(data.customer_id ? { paddleCustomerId: data.customer_id } : {}),
      paddleSubscriptionId: data.id,
      subscriptionActive: ACTIVE_SUBSCRIPTION_STATUSES.has(options.status.toLowerCase()),
      ...(options.clearAddons ? { subscriptionAddons: [] } : {}),
      ...(options.includeAddons ? { subscriptionAddons: activeAddons } : {}),
      subscriptionStatus: options.status,
    },
  });
  return { addons: options.clearAddons ? [] : activeAddons, updated: clientId };
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
  const { clientId, productSpecId } = data.custom_data ?? {};
  console.error("[Paddle] Transaction payment failed:", { clientId, productSpecId, transactionId: data.id });
  return { logged: data.id };
}

export async function applyPaddleWebhook(payload: PaddleWebhookPayload): Promise<unknown> {
  const eventType = payload.event_type;
  const data = payload.data;

  try {
    switch (eventType) {
      case "subscription.activated":
        if (!isSubscriptionData(data)) throw new Error("Invalid Paddle subscription payload");
        return handleSubscriptionActivated(data);
      case "subscription.created":
        if (!isSubscriptionData(data)) throw new Error("Invalid Paddle subscription payload");
        return handleSubscriptionActivated(data);
      case "subscription.updated":
        if (!isSubscriptionData(data)) throw new Error("Invalid Paddle subscription payload");
        return handleSubscriptionUpdated(data);
      case "subscription.canceled":
        if (!isSubscriptionData(data)) throw new Error("Invalid Paddle subscription payload");
        return handleSubscriptionCanceled(data);
      case "subscription.paused":
        if (!isSubscriptionData(data)) throw new Error("Invalid Paddle subscription payload");
        return handleSubscriptionPaused(data);
      case "subscription.past_due":
        if (!isSubscriptionData(data)) throw new Error("Invalid Paddle subscription payload");
        return handleSubscriptionPastDue(data);
      case "subscription.resumed":
        if (!isSubscriptionData(data)) throw new Error("Invalid Paddle subscription payload");
        return handleSubscriptionUpdated(data);
      case "transaction.completed":
        if (!isTransactionData(data)) throw new Error("Invalid Paddle transaction payload");
        return handleTransactionCompleted(data);
      case "transaction.payment_failed":
        if (!isTransactionData(data)) throw new Error("Invalid Paddle transaction payload");
        return handleTransactionPaymentFailed(data);
      default:
        return { eventType, received: true };
    }
  } catch (err) {
    console.error(`[Paddle webhook] Handler failed for ${eventType}:`, err);
    throw err;
  }
}
