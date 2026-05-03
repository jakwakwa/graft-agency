export type PricingMode = "landing" | "portal";
export type PricingOfferKind = "subscription" | "addon" | "one_time";
export type BillingCycle = "monthly" | "annual" | "oneTime";

export interface PricingCatalogEnv {
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
  fallbackPrice: string;
  suffix: string;
}

export interface PricingOffer {
  id: string;
  title: string;
  description: string;
  kind: PricingOfferKind;
  badge?: string;
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

export function buildPricingCatalog(env: PricingCatalogEnv = process.env): PricingCatalog {
  return {
    offers: [
      {
        id: "ai-chatbot",
        title: "AI Chatbot",
        description: "AI-powered chatbot embedded on your website for enquiries, lead capture, and 24/7 response.",
        kind: "subscription",
        badge: "Core subscription",
        features: ["Website embed included", "Lead capture workflow", "Works around the clock"],
        prices: {
          monthly: option({
            cycle: "monthly",
            label: "Monthly",
            priceId: env.PADDLE_PRICE_CHATBOT_MONTHLY,
            productId: configured(env.PADDLE_PRODUCT_CHATBOT),
            fallbackPrice: "£147",
            suffix: "/month",
          }),
          annual: option({
            cycle: "annual",
            label: "Annual",
            priceId: env.PADDLE_PRICE_CHATBOT_ANNUAL,
            productId: configured(env.PADDLE_PRODUCT_CHATBOT),
            fallbackPrice: "£1,470",
            suffix: "/year",
          }),
        },
      },
      {
        id: "voice-agent",
        title: "Voice Agent Add-on",
        description: "Upgrade your chatbot with phone-style voice enquiry handling.",
        kind: "addon",
        features: ["Automatic call-style responses", "Useful for after-hours enquiries", "Subscription add-on"],
        prices: {
          monthly: option({
            cycle: "monthly",
            label: "Monthly",
            priceId: env.PADDLE_PRICE_VOICE_MONTHLY,
            productId: configured(env.PADDLE_PRODUCT_VOICE),
            fallbackPrice: "£37",
            suffix: "/month",
          }),
        },
      },
      {
        id: "booking-integration",
        title: "Booking Integration Add-on",
        description: "Let your chatbot book appointments directly into your calendar.",
        kind: "addon",
        features: ["Calendar booking flow", "Reduces manual follow-up", "Subscription add-on"],
        prices: {
          monthly: option({
            cycle: "monthly",
            label: "Monthly",
            priceId: env.PADDLE_PRICE_BOOKING_MONTHLY,
            productId: configured(env.PADDLE_PRODUCT_BOOKING),
            fallbackPrice: "£27",
            suffix: "/month",
          }),
        },
      },
      {
        id: "landing-page-build",
        title: "Landing Page Build",
        description: "A single-page website designed to convert visitors into enquiries.",
        kind: "one_time",
        features: ["Conversion-focused page", "Mobile-optimised build", "One-time project"],
        prices: {
          oneTime: option({
            cycle: "oneTime",
            label: "One-time",
            priceId: env.PADDLE_PRICE_LANDING,
            productId: configured(env.PADDLE_PRODUCT_LANDING),
            fallbackPrice: "£497",
            suffix: " once",
          }),
        },
      },
      {
        id: "small-business-website-build",
        title: "Small Business Website Build",
        description: "A multi-page website with your AI chatbot pre-installed.",
        kind: "one_time",
        features: ["Up to five pages", "Mobile-optimised design", "Chatbot installed"],
        prices: {
          oneTime: option({
            cycle: "oneTime",
            label: "One-time",
            priceId: env.PADDLE_PRICE_SMB,
            productId: configured(env.PADDLE_PRODUCT_SMB),
            fallbackPrice: "£997",
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
