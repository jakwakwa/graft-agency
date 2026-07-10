import { auth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import { z } from "zod";
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  ADDON_ALREADY_ACTIVE_CODE,
  ADDON_NOT_AVAILABLE_CODE,
  getAddonPriceId,
  isVoiceAddonAvailable,
  SUBSCRIPTION_REQUIRED_CODE,
} from "@/lib/billing/entitlements";
import prisma from "@/lib/db/prisma";
import { paddle } from "@/lib/paddle";

const bodySchema = z.object({
  priceId: z.string().min(1),
});

const ADDON_PRICE_IDS = [process.env.PADDLE_PRICE_VOICE_MONTHLY, process.env.PADDLE_PRICE_BOOKING_MONTHLY].filter(
  Boolean,
) as string[];

/**
 * Adds an add-on to the workspace's active subscription. Add-only by design:
 * an add-on can be added at most once per subscription lifetime, and there is
 * deliberately no removal path here — cancelling an add-on (or the
 * subscription itself) happens exclusively in the Paddle customer portal via
 * Manage Subscription, and our state resyncs from Paddle webhooks.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const { priceId } = parsed.data;

  if (!ADDON_PRICE_IDS.includes(priceId)) {
    return Response.json({ error: "Price ID is not an allowed add-on" }, { status: 400 });
  }

  // Feature flag: the Voice Agent add-on has no product capability yet — no
  // one can activate (and be billed for) it until FEATURE_VOICE_ADDON=true.
  if (priceId === getAddonPriceId("voice") && !isVoiceAddonAvailable()) {
    return Response.json(
      {
        error: "The Voice Agent add-on is coming soon and cannot be activated yet",
        code: ADDON_NOT_AVAILABLE_CODE,
      },
      { status: 403 },
    );
  }

  const client = await prisma.client.findUnique({ where: { clerkUserId: userId } });
  if (!client) return Response.json({ error: "Client not found" }, { status: 404 });

  // Prerequisite gate: add-ons require an active base AI Chatbot subscription.
  const paddleSubscriptionId = client.paddleSubscriptionId;
  const baseActive =
    Boolean(paddleSubscriptionId) &&
    client.subscriptionActive &&
    ACTIVE_SUBSCRIPTION_STATUSES.has(client.subscriptionStatus.toLowerCase());
  if (!paddleSubscriptionId || !baseActive) {
    return Response.json(
      {
        error: "An active AI Chatbot subscription is required before adding add-ons",
        code: SUBSCRIPTION_REQUIRED_CODE,
      },
      { status: 403 },
    );
  }

  const subscription = await paddle.subscriptions.get(paddleSubscriptionId);

  const currentItems = (subscription.items ?? []).map((item) => ({
    priceId: item.price!.id,
    quantity: item.quantity,
  }));

  // Duplicate guard against the live Paddle subscription — the source of
  // truth, immune to stale local state or double-clicks racing the webhook.
  if (currentItems.some((item) => item.priceId === priceId)) {
    const activeAddons = currentItems.map((i) => i.priceId).filter((id) => ADDON_PRICE_IDS.includes(id));
    return Response.json(
      {
        error: "This add-on is already active on your subscription",
        code: ADDON_ALREADY_ACTIVE_CODE,
        activeAddons,
      },
      { status: 409 },
    );
  }

  const updatedItems = [...currentItems, { priceId, quantity: 1 }];

  await paddle.subscriptions.update(paddleSubscriptionId, {
    items: updatedItems,
    prorationBillingMode: "prorated_next_billing_period",
  });

  const activeAddons = updatedItems.map((i) => i.priceId).filter((id) => ADDON_PRICE_IDS.includes(id));

  await prisma.client.update({
    where: { id: client.id },
    data: { subscriptionAddons: activeAddons },
  });

  return Response.json({ ok: true, activeAddons });
}
