import { describe, expect, it } from "vitest";
import { buildPricingCatalog, getPreviewItems } from "@/lib/billing/pricing-catalog";

const completeEnv = {
  PADDLE_PRODUCT_CHATBOT: "pro_chatbot",
  PADDLE_PRODUCT_VOICE: "pro_voice",
  PADDLE_PRODUCT_BOOKING: "pro_booking",
  PADDLE_PRODUCT_LANDING: "pro_landing",
  PADDLE_PRODUCT_SMB: "pro_smb",
  PADDLE_PRICE_CHATBOT_MONTHLY: "pri_chatbot_monthly",
  PADDLE_PRICE_CHATBOT_ANNUAL: "pri_chatbot_annual",
  PADDLE_PRICE_VOICE_MONTHLY: "pri_voice_monthly",
  PADDLE_PRICE_BOOKING_MONTHLY: "pri_booking_monthly",
  PADDLE_PRICE_LANDING: "pri_landing",
  PADDLE_PRICE_SMB: "pri_smb",
};

describe("pricing catalogue", () => {
  it("builds the full Paddle catalogue from configured product and price IDs", () => {
    const catalogue = buildPricingCatalog(completeEnv);

    expect(catalogue.offers.map((offer) => offer.id)).toEqual([
      "ai-chatbot",
      "voice-agent",
      "booking-integration",
      "landing-page-build",
      "small-business-website-build",
    ]);
    expect(catalogue.offers[0]?.prices.monthly?.priceId).toBe("pri_chatbot_monthly");
    expect(catalogue.offers[0]?.prices.annual?.priceId).toBe("pri_chatbot_annual");
    expect(catalogue.offers[3]?.prices.oneTime?.priceId).toBe("pri_landing");
  });

  it("positions one-time offers as GraftBot implementation packages", () => {
    const catalogue = buildPricingCatalog(completeEnv);
    const landing = catalogue.offers.find((offer) => offer.id === "landing-page-build");
    const smb = catalogue.offers.find((offer) => offer.id === "small-business-website-build");
    const chatbot = catalogue.offers.find((offer) => offer.id === "ai-chatbot");

    expect(landing?.title).toBe("GraftBot Landing Page Setup");
    expect(landing?.description).toMatch(/implementation package/i);
    expect(landing?.description).toMatch(/GraftBot/i);
    expect(smb?.title).toBe("GraftBot Multi-Page Website Setup");
    expect(smb?.description).toMatch(/implementation package/i);
    expect(chatbot?.features).toContain("Visitor-initiated conversations");
    expect(chatbot?.features).toContain("Consent-based lead capture");
    expect(chatbot?.features).not.toContain("Fast Setup to Go-Live (under 1 hour)");
  });

  it("excludes missing Paddle price IDs from preview requests without dropping the offer", () => {
    const catalogue = buildPricingCatalog({
      ...completeEnv,
      PADDLE_PRICE_LANDING: "",
    });

    const landingOffer = catalogue.offers.find((offer) => offer.id === "landing-page-build");

    expect(landingOffer).toBeDefined();
    expect(landingOffer?.prices.oneTime).toBeUndefined();
    expect(getPreviewItems(catalogue).map((item) => item.priceId)).not.toContain("");
    expect(getPreviewItems(catalogue).map((item) => item.priceId)).not.toContain("pri_landing");
  });
});
