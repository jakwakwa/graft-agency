import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { ACTIVE_SUBSCRIPTION_STATUSES, SUBSCRIPTION_ALREADY_ACTIVE_CODE } from "@/lib/billing/entitlements";
import prisma from "@/lib/db/prisma";
import { paddle } from "@/lib/paddle";

const bodySchema = z.object({
  priceId: z.string().min(1),
});

function getBaseSubscriptionPriceIds() {
  return [process.env.PADDLE_PRICE_CHATBOT_MONTHLY, process.env.PADDLE_PRICE_CHATBOT_ANNUAL].filter(
    Boolean,
  ) as string[];
}

/** Paddle statuses under which a workspace must never open a second base checkout. */
const BLOCKING_PADDLE_STATUSES = new Set(["active", "trialing", "paused", "past_due"]);

/**
 * Creates a server-side Paddle transaction for the base AI Graft AI Agent
 * subscription. The overlay checkout is opened against the returned
 * transaction ID, so the one-subscription-per-workspace rule is enforced
 * here — it cannot be bypassed by invoking Paddle checkout from the browser
 * console. Re-subscribing only becomes possible after Paddle delivers the
 * cancellation webhook and our synced state reflects it.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const { priceId } = parsed.data;
  if (!getBaseSubscriptionPriceIds().includes(priceId)) {
    return Response.json({ error: "Price ID is not a base subscription" }, { status: 400 });
  }

  const client = await prisma.client.findFirst({
    where: { clerkUserId: userId, deletedAt: null },
    select: {
      id: true,
      paddleCustomerId: true,
      paddleSubscriptionId: true,
      subscriptionActive: true,
      subscriptionStatus: true,
    },
  });
  if (!client) return Response.json({ error: "Client not found" }, { status: 404 });

  const alreadySubscribed =
    client.subscriptionActive && ACTIVE_SUBSCRIPTION_STATUSES.has(client.subscriptionStatus.toLowerCase());
  if (alreadySubscribed) {
    return Response.json(
      {
        error: "This workspace already has an active AI Graft AI Agent subscription",
        code: SUBSCRIPTION_ALREADY_ACTIVE_CODE,
      },
      { status: 409 },
    );
  }

  // Belt-and-braces: even if our synced state lags, check the live Paddle
  // subscription before allowing a new checkout. Paused / past-due
  // subscriptions are resolved in the Paddle portal, never by stacking a
  // second subscription on top.
  if (client.paddleSubscriptionId) {
    const subscription = await paddle.subscriptions.get(client.paddleSubscriptionId);
    if (BLOCKING_PADDLE_STATUSES.has(subscription.status)) {
      return Response.json(
        {
          error: "This workspace already has an AI Graft AI Agent subscription — manage it via Manage Subscription",
          code: SUBSCRIPTION_ALREADY_ACTIVE_CODE,
        },
        { status: 409 },
      );
    }
  }

  const transaction = await paddle.transactions.create({
    items: [{ priceId, quantity: 1 }],
    ...(client.paddleCustomerId ? { customerId: client.paddleCustomerId } : {}),
    customData: { clientId: client.id },
  });

  return Response.json({ transactionId: transaction.id });
}
