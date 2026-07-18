import { cacheTags } from "@/lib/db/cache";
import prisma from "@/lib/db/prisma";

export const SUBSCRIPTION_REQUIRED_CODE = "SUBSCRIPTION_REQUIRED" as const;
export const SUBSCRIPTION_ALREADY_ACTIVE_CODE = "SUBSCRIPTION_ALREADY_ACTIVE" as const;
export const ADDON_ALREADY_ACTIVE_CODE = "ADDON_ALREADY_ACTIVE" as const;
export const ADDON_NOT_AVAILABLE_CODE = "ADDON_NOT_AVAILABLE" as const;
export const BOOKING_ADDON_REQUIRED_CODE = "BOOKING_ADDON_REQUIRED" as const;

export type AddonFeature = "voice" | "booking";

/** Maps an add-on feature to its Paddle price ID (undefined when unconfigured). */
export function getAddonPriceId(feature: AddonFeature): string | undefined {
  const value = feature === "voice" ? process.env.PADDLE_PRICE_VOICE_MONTHLY : process.env.PADDLE_PRICE_BOOKING_MONTHLY;
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Feature flag: the Voice Agent add-on is sold as a SKU but has no product
 * capability yet, so activation is disabled ("coming soon") until this flag
 * is set. Flip by setting FEATURE_VOICE_ADDON=true.
 */
export function isVoiceAddonAvailable(): boolean {
  return process.env.FEATURE_VOICE_ADDON === "true";
}

/** Paddle subscription statuses that count as entitled. Mirrors chat-protection + webhook logic. */
export const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export interface ClientEntitlements {
  clientId: string;
  /** True only when the workspace's base subscription is genuinely active. */
  subscriptionActive: boolean;
  subscriptionStatus: string;
  subscriptionAddons: string[];
  /** Platform owner bypass — never paygated. */
  exempt: boolean;
  /** Active subscription OR exempt. Use this for gating decisions. */
  hasChatbotAccess: boolean;
  /**
   * Booking Integration add-on active (or exempt). Gates Cal.com scheduling
   * everywhere: the bot's booking tools, booking prompts, and portal booking
   * settings. Without it the bot is knowledge-only and falls back to
   * capturing contact details for the owner to follow up.
   */
  hasBookingAccess: boolean;
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
  const exempt = client.isPlatformOwner;

  const bookingPriceId = getAddonPriceId("booking");
  const bookingAddonActive =
    subscriptionActive && Boolean(bookingPriceId) && client.subscriptionAddons.includes(bookingPriceId as string);

  return {
    clientId,
    subscriptionActive,
    subscriptionStatus: client.subscriptionStatus,
    subscriptionAddons: client.subscriptionAddons,
    exempt,
    hasChatbotAccess: subscriptionActive || exempt,
    hasBookingAccess: bookingAddonActive || exempt,
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

export interface BookingAddonRequiredError {
  code: typeof BOOKING_ADDON_REQUIRED_CODE;
  error: string;
  status: 403;
}

/**
 * Guard for booking-specific mutations. Returns `null` when the workspace has
 * the Booking Integration add-on (or is exempt), otherwise a 403 payload.
 */
export async function requireBookingAddon(clientId: string): Promise<BookingAddonRequiredError | null> {
  const entitlements = await getClientEntitlements(clientId);
  if (entitlements?.hasBookingAccess) return null;
  return {
    code: BOOKING_ADDON_REQUIRED_CODE,
    error: "The Booking Integration add-on is required for this workspace",
    status: 403,
  };
}
