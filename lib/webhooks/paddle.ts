import { getBuildPriceIds } from "@/lib/billing/build-purchases";
import { cacheTags, invalidateCacheTags } from "@/lib/db/cache";
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
  items?: Array<{ price?: { id?: string } | null; quantity?: number }>;
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

function getBasePriceIds(): string[] {
  return [process.env.PADDLE_PRICE_Graft AI Agent_MONTHLY, process.env.PADDLE_PRICE_Graft AI Agent_ANNUAL].filter(
    Boolean,
  ) as string[];
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
  const itemPriceIds = (data.items ?? []).map((item) => item.price.id);
  const activeAddons = itemPriceIds.filter((id) => getAddonPriceIds().includes(id));
  const basePriceIds = getBasePriceIds();
  const hasBaseItem = basePriceIds.length === 0 || itemPriceIds.some((id) => basePriceIds.includes(id));

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { paddleSubscriptionId: true, subscriptionActive: true },
  });
  if (!client) {
    throw new Error(`Unable to resolve Paddle subscription ${data.id}: client ${clientId} not found`);
  }

  const isDifferentSubscription = Boolean(client.paddleSubscriptionId) && client.paddleSubscriptionId !== data.id;

  // Duplicate-base-subscription lock: a workspace already holding an active base
  // subscription must not have it clobbered by a second checkout's subscription.
  if (isDifferentSubscription && client.subscriptionActive && hasBaseItem) {
    console.error(
      `[Paddle webhook] Rejected duplicate base subscription ${data.id} for client ${clientId} (active: ${client.paddleSubscriptionId})`,
    );
    return { skipped: "duplicate-base-subscription", clientId, subscriptionId: data.id };
  }

  // Add-on hierarchy guard: a standalone subscription containing only add-on
  // items (no base price) must not activate the workspace. Covers direct
  // checkout-URL abuse when no base subscription exists at all.
  if (client.paddleSubscriptionId !== data.id && !hasBaseItem && (data.items ?? []).length > 0) {
    console.error(
      `[Paddle webhook] Rejected add-on-only subscription ${data.id} for client ${clientId}: no active base subscription line item`,
    );
    return { skipped: "addon-without-base-subscription", clientId, subscriptionId: data.id };
  }

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
  await invalidateCacheTags([cacheTags.client(clientId)]);
  return { addons: options.clearAddons ? [] : activeAddons, updated: clientId };
}

async function handleTransactionCompleted(data: TransactionData) {
  const { clientId, productSpecId } = data.custom_data ?? {};
  const results: Record<string, unknown> = {};

  // Record one-time website build purchases (idempotent on transaction id) —
  // this is what the per-month quantity rule counts against.
  const buildPriceIds = getBuildPriceIds();
  const purchasedBuildPriceId = (data.items ?? [])
    .map((item) => item.price?.id)
    .find((id): id is string => Boolean(id && buildPriceIds.includes(id)));

  if (clientId && purchasedBuildPriceId) {
    await prisma.buildPurchase.upsert({
      where: { paddleTransactionId: data.id },
      create: { clientId, priceId: purchasedBuildPriceId, paddleTransactionId: data.id },
      update: { status: "completed" },
    });
    results.buildPurchase = { clientId, priceId: purchasedBuildPriceId, transactionId: data.id };
  }

  if (productSpecId) {
    await prisma.productSpec.update({
      where: { id: productSpecId },
      data: { stage: "OFFER_SENT" },
    });
    results.updatedProductSpec = productSpecId;
  }

  if (Object.keys(results).length === 0) {
    return { warning: "No productSpecId or build purchase in transaction custom_data/items" };
  }
  return results;
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
