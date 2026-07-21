import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PricingSection } from "@/components/pricing/pricing-section";
import { buildPricingCatalog } from "@/lib/billing/pricing-catalog";

const paddleMocks = vi.hoisted(() => ({
  checkoutOpen: vi.fn(),
}));

vi.mock("@paddle/paddle-js", () => ({
  CheckoutEventNames: { CHECKOUT_COMPLETED: "checkout.completed" },
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
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

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the landing section as information only", () => {
    render(<PricingSection catalogue={catalogue} mode="landing" paddleConfig={paddleConfig} />);

    expect(screen.getByRole("heading", { name: "Simple pricing for faster growth" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View portal billing" })).toHaveAttribute("href", "/portal/billing");
    expect(screen.queryByRole("button", { name: "Subscribe to Graft AI Agent" })).not.toBeInTheDocument();
  });

  it("confirms via the modal before opening subscription checkout in the portal", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ transactionId: "txn_123" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <PricingSection
        catalogue={catalogue}
        mode="portal"
        paddleConfig={paddleConfig}
        customer={{ clientId: "client_123", email: "owner@graft.today", subscriptionActive: false }}
      />,
    );

    // Clicking Subscribe opens the confirmation modal — it does NOT open Paddle yet.
    fireEvent.click(await screen.findByRole("button", { name: "Subscribe to Graft AI Agent" }));

    const dialogTitle = await screen.findByText("Are you sure you want to subscribe to Graft AI Agent?");
    expect(dialogTitle).toBeInTheDocument();
    expect(paddleMocks.checkoutOpen).not.toHaveBeenCalled();

    // The modal surfaces the refund/cancellation and other legal links.
    expect(screen.getByRole("link", { name: "Refund & Cancellation Policy" })).toHaveAttribute("href", "/refunds");
    expect(screen.getByRole("link", { name: "Terms of Use" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");

    // "Continue to payment" runs the server-transaction flow, then opens Paddle.
    fireEvent.click(screen.getByRole("button", { name: "Continue to payment" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/billing/subscribe/checkout",
        expect.objectContaining({ method: "POST" }),
      );
      expect(paddleMocks.checkoutOpen).toHaveBeenCalledWith({ transactionId: "txn_123" });
    });

    const requestBody = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(requestBody).toEqual({ priceId: "pri_chatbot_monthly" });
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

    expect(screen.queryByRole("button", { name: "Subscribe to Graft AI Agent" })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "If you want Graft AI Agents installed on a new site, choose one of these fixed-scope website setup packages",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Graft AI Agents Landing Page Setup")).toBeInTheDocument();
    expect(screen.getByText("Graft AI Agents Multi-Page Website Setup")).toBeInTheDocument();
  });
});
