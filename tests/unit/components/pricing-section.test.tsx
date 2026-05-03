import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PricingSection } from "@/components/pricing/pricing-section";
import { buildPricingCatalog } from "@/lib/billing/pricing-catalog";

const paddleMocks = vi.hoisted(() => ({
  checkoutOpen: vi.fn(),
}));

vi.mock("@paddle/paddle-js", () => ({
  initializePaddle: vi.fn().mockResolvedValue({
    Checkout: {
      open: paddleMocks.checkoutOpen,
    },
    PricePreview: vi.fn().mockResolvedValue({
      data: {
        details: {
          lineItems: [],
        },
      },
    }),
  }),
}));

const catalogue = buildPricingCatalog({
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
});

const paddleConfig = {
  clientToken: "test_client_token",
  environment: "sandbox" as const,
};

describe("PricingSection", () => {
  beforeEach(() => {
    paddleMocks.checkoutOpen.mockClear();
  });

  it("renders the landing section as information only", () => {
    render(<PricingSection catalogue={catalogue} mode="landing" paddleConfig={paddleConfig} />);

    expect(screen.getByRole("heading", { name: "Simple pricing for always-on growth" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View portal billing" })).toHaveAttribute("href", "/portal/billing");
    expect(screen.queryByRole("button", { name: "Subscribe to AI Chatbot" })).not.toBeInTheDocument();
  });

  it("opens subscription checkout in the portal when there is no active subscription", async () => {
    render(
      <PricingSection
        catalogue={catalogue}
        mode="portal"
        paddleConfig={paddleConfig}
        customer={{ clientId: "client_123", email: "owner@graft.today", subscriptionActive: false }}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Subscribe to AI Chatbot" }));

    await waitFor(() => {
      expect(paddleMocks.checkoutOpen).toHaveBeenCalledWith({
        items: [{ priceId: "pri_chatbot_monthly", quantity: 1 }],
        customer: { email: "owner@graft.today" },
        customData: { clientId: "client_123" },
      });
    });
  });

  it("keeps portal pricing information-only when a subscription is active", () => {
    render(
      <PricingSection
        catalogue={catalogue}
        mode="portal"
        paddleConfig={paddleConfig}
        customer={{ clientId: "client_123", email: "owner@graft.today", subscriptionActive: true }}
      />,
    );

    expect(screen.queryByRole("button", { name: "Subscribe to AI Chatbot" })).not.toBeInTheDocument();
    expect(screen.getByText("Included in your active subscription")).toBeInTheDocument();
  });
});
