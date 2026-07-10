import { cacheTags } from "@/lib/db/cache";
import prisma from "@/lib/db/prisma";

export const SUBSCRIPTION_REQUIRED_CODE = "SUBSCRIPTION_REQUIRED" as const;

/** Paddle subscription statuses that count as entitled. Mirrors chat-protection + webhook logic. */
export const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export interface ClientEntitlements {
  clientId: string;
  /** True only when the workspace's base subscription is genuinely active. */
  subscriptionActive: boolean;
  subscriptionStatus: string;
  subscriptionAddons: string[];
  /** Platform owner / reseller bypass — never paygated. */
  exempt: boolean;
  /** Active subscription OR exempt. Use this for gating decisions. */
  hasChatbotAccess: boolean;
}

/**
 * Resolves the entitlement state of a workspace (Client). This is the single
 * source of truth for paygating: it evaluates the *workspace's* subscription,
 * not the individual user — invited members inherit exactly the same state as
 * the workspace creator.
 */
export async function getClientEntitlements(clientId: string): Promise<ClientEntitlements | null> {
  const client = await prisma.client.findFirst({
    where: { id: clientId, deletedAt: null },
    select: {
      isPlatformOwner: true,
      isReseller: true,
      subscriptionActive: true,
      subscriptionStatus: true,
      subscriptionAddons: true,
    },
    cacheStrategy: {
      ttl: 30,
      swr: 120,
      tags: [cacheTags.client(clientId)],
    },
  });
  if (!client) return null;

  const subscriptionActive =
    client.subscriptionActive && ACTIVE_SUBSCRIPTION_STATUSES.has(client.subscriptionStatus.toLowerCase());
  const exempt = client.isPlatformOwner || client.isReseller;

  return {
    clientId,
    subscriptionActive,
    subscriptionStatus: client.subscriptionStatus,
    subscriptionAddons: client.subscriptionAddons,
    exempt,
    hasChatbotAccess: subscriptionActive || exempt,
  };
}

export interface SubscriptionRequiredError {
  code: typeof SUBSCRIPTION_REQUIRED_CODE;
  error: string;
  status: 403;
}

/**
 * Guard for mutation routes / server actions. Returns `null` when the
 * workspace is entitled, otherwise a billing-specific 403 payload.
 */
export async function requireActiveSubscription(clientId: string): Promise<SubscriptionRequiredError | null> {
  const entitlements = await getClientEntitlements(clientId);
  if (entitlements?.hasChatbotAccess) return null;
  return {
    code: SUBSCRIPTION_REQUIRED_CODE,
    error: "An active AI Chatbot subscription is required for this workspace",
    status: 403,
  };
}
