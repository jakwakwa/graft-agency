import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db/prisma";
import { ACTIVE_SUBSCRIPTION_STATUSES } from "@/lib/billing/entitlements";

export const dynamic = "force-dynamic";

/**
 * Uncached subscription status for the current user's workspace.
 * Polled by the billing page after a Paddle checkout completes so the UI can
 * ungate without a manual hard refresh.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Deliberately no cacheStrategy: this read must observe the webhook write immediately.
  const client = await prisma.client.findFirst({
    where: { clerkUserId: userId, deletedAt: null },
    select: {
      subscriptionActive: true,
      subscriptionStatus: true,
      subscriptionAddons: true,
      paddleCustomerId: true,
    },
  });
  if (!client) return Response.json({ error: "Client not found" }, { status: 404 });

  const subscriptionActive =
    client.subscriptionActive && ACTIVE_SUBSCRIPTION_STATUSES.has(client.subscriptionStatus.toLowerCase());

  return Response.json({
    subscriptionActive,
    subscriptionStatus: client.subscriptionStatus,
    subscriptionAddons: client.subscriptionAddons,
    hasPaddleCustomer: Boolean(client.paddleCustomerId),
  });
}
