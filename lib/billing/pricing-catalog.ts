export type PricingMode = "landing" | "portal";
export type PricingOfferKind = "subscription" | "addon" | "one_time";
export type BillingCycle = "monthly" | "annual" | "oneTime";

export interface PricingCatalogEnv {
  /** Feature flag — the Voice Agent add-on is "coming soon" until "true". */
  FEATURE_VOICE_ADDON?: string;
  PADDLE_PRODUCT_CHATBOT?: string;
  PADDLE_PRODUCT_VOICE?: string;
  PADDLE_PRODUCT_BOOKING?: string;
  PADDLE_PRODUCT_LANDING?: string;
  PADDLE_PRODUCT_SMB?: string;
  PADDLE_PRICE_CHATBOT_MONTHLY?: string;
  PADDLE_PRICE_CHATBOT_ANNUAL?: string;
  PADDLE_PRICE_VOICE_MONTHLY?: string;
  PADDLE_PRICE_BOOKING_MONTHLY?: string;
  PADDLE_PRICE_LANDING?: string;
  PADDLE_PRICE_SMB?: string;
}

export interface PricingOption {
  cycle: BillingCycle;
  label: string;
  priceId: string;
  productId?: string;
  suffix: string;
}

export interface PricingOffer {
  id: string;
  title: string;
  description: string;
  kind: PricingOfferKind;
  badge?: string;
  /** Not purchasable yet — rendered as a disabled "Coming soon" card. */
  comingSoon?: boolean;
  features: string[];
  prices: Partial<Record<BillingCycle, PricingOption>>;
}

export interface PricingCatalog {
  offers: PricingOffer[];
}

export interface PaddlePreviewItem {
  priceId: string;
  quantity: number;
}

const configured = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const option = (params: Omit<PricingOption, "priceId"> & { priceId?: string }): PricingOption | undefined => {
  const priceId = configured(params.priceId);
  if (!priceId) return undefined;
  return { ...params, priceId };
};

export function getPricingCatalogEnv(): PricingCatalogEnv {
  return {
    FEATURE_VOICE_ADDON: process.env.FEATURE_VOICE_ADDON,
    PADDLE_PRODUCT_CHATBOT: process.env.PADDLE_PRODUCT_CHATBOT,
    PADDLE_PRODUCT_VOICE: process.env.PADDLE_PRODUCT_VOICE,
    PADDLE_PRODUCT_BOOKING: process.env.PADDLE_PRODUCT_BOOKING,
    PADDLE_PRODUCT_LANDING: process.env.PADDLE_PRODUCT_LANDING,
    PADDLE_PRODUCT_SMB: process.env.PADDLE_PRODUCT_SMB,
    PADDLE_PRICE_CHATBOT_MONTHLY: process.env.PADDLE_PRICE_CHATBOT_MONTHLY,
    PADDLE_PRICE_CHATBOT_ANNUAL: process.env.PADDLE_PRICE_CHATBOT_ANNUAL,
    PADDLE_PRICE_VOICE_MONTHLY: process.env.PADDLE_PRICE_VOICE_MONTHLY,
    PADDLE_PRICE_BOOKING_MONTHLY: process.env.PADDLE_PRICE_BOOKING_MONTHLY,
    PADDLE_PRICE_LANDING: process.env.PADDLE_PRICE_LANDING,
    PADDLE_PRICE_SMB: process.env.PADDLE_PRICE_SMB,
  };
}

export function buildPricingCatalog(env: PricingCatalogEnv = getPricingCatalogEnv()): PricingCatalog {
  return {
    offers: [
      {
        id: "ai-chatbot",
        title: "GRAFT AI Assistant",
        description:
          "Embeddable GRAFT AI Assistant widget for visitor-initiated enquiries, consent-based traging, and optional booking.",
        kind: "subscription",
        badge: "Core subscription",
        features: [
          "Website embed included",
          "Visitor-initiated conversations",
          "Consent-based traging",
          "Human handoff to your dashboard",
          "Tenant-scoped data isolation",
        ],
        prices: {
          monthly: option({
            cycle: "monthly",
            label: "Monthly",
            priceId: env.PADDLE_PRICE_CHATBOT_MONTHLY,
            productId: configured(env.PADDLE_PRODUCT_CHATBOT),
            suffix: "/month",
          }),
          annual: option({
            cycle: "annual",
            label: "Annual",
            priceId: env.PADDLE_PRICE_CHATBOT_ANNUAL,
            productId: configured(env.PADDLE_PRODUCT_CHATBOT),
            suffix: "/year",
          }),
        },
      },
      {
        id: "voice-agent",
        title: "Voice Agent Add-on",
        description: "Upgrade your chatbot with phone-style voice enquiry handling.",
        kind: "addon",
        ...(env.FEATURE_VOICE_ADDON === "true" ? {} : { badge: "Coming soon", comingSoon: true }),
        features: [
          "Voice-first Enquiry Response",
          "Always available to take calls",
          "Monthly subscription only add-on",
          "Eliminates missed calls",
          "Natural voice conversations",
          "Works alongside your existing chatbot",
        ],
        prices: {
          monthly: option({
            cycle: "monthly",
            label: "Monthly",
            priceId: env.PADDLE_PRICE_VOICE_MONTHLY,
            productId: configured(env.PADDLE_PRODUCT_VOICE),
            suffix: "/month",
          }),
        },
      },
      {
        id: "booking-integration",
        title: "Booking Integration Add-on",
        description:
          "Let your chatbot book appointments directly, scanning availability and scheduling into your pre-selected synced calendar slots.",
        kind: "addon",
        features: [
          "Calendar Integrated booking flow with Cal.com or Calendly",
          "Ai Schedules Appointments  during conversations",
          "Reduces manual follow-up and fress up time",
          "Montly Subscription-only add-on",
        ],
        prices: {
          monthly: option({
            cycle: "monthly",
            label: "Monthly",
            priceId: env.PADDLE_PRICE_BOOKING_MONTHLY,
            productId: configured(env.PADDLE_PRODUCT_BOOKING),
            suffix: "/month",
          }),
        },
      },
      {
        id: "landing-page-build",
        title: "GRAFT AI Assistant Landing Page Setup",
        description:
          "Fixed-scope implementation package: a single-page site configured to host and showcase your GRAFT AI Assistant widget.",
        kind: "one_time",
        features: [
          "Single-page site for GRAFT AI Assistant setup",
          "Widget install and brand styling",
          "One-time software implementation",
        ],
        prices: {
          oneTime: option({
            cycle: "oneTime",
            label: "One-time",
            priceId: env.PADDLE_PRICE_LANDING,
            productId: configured(env.PADDLE_PRODUCT_LANDING),
            suffix: " once",
          }),
        },
      },
      {
        id: "small-business-website-build",
        title: "GRAFT AI Assistant Multi-Page Website Setup",
        description:
          "Fixed-scope implementation package: a multi-page site with GRAFT AI Assistant installed and configured for your business.",
        kind: "one_time",
        features: [
          "Up to five pages with GRAFT AI Assistant setup",
          "Widget install and brand styling",
          "One-time software implementation",
        ],
        prices: {
          oneTime: option({
            cycle: "oneTime",
            label: "One-time",
            priceId: env.PADDLE_PRICE_SMB,
            productId: configured(env.PADDLE_PRODUCT_SMB),
            suffix: " once",
          }),
        },
      },
    ],
  };
}

export function getPreviewItems(catalogue: PricingCatalog): PaddlePreviewItem[] {
  return catalogue.offers.flatMap((offer) =>
    Object.values(offer.prices)
      .filter((price): price is PricingOption => Boolean(price))
      .map((price) => ({ priceId: price.priceId, quantity: 1 })),
  );
}
