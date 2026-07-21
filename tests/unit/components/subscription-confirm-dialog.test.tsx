import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { computeAnnualSavings, SubscriptionConfirmDialog } from "@/components/pricing/subscription-confirm-dialog";
import { buildPricingCatalog, type PricingOffer } from "@/lib/billing/pricing-catalog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

const catalogue = buildPricingCatalog({
  PADDLE_PRODUCT_CHATBOT: "pro_chatbot",
  PADDLE_PRICE_CHATBOT_MONTHLY: "pri_chatbot_monthly",
  PADDLE_PRICE_CHATBOT_ANNUAL: "pri_chatbot_annual",
});

const chatbotOffer = catalogue.offers.find((offer) => offer.id === "ai-chatbot") as PricingOffer;

describe("computeAnnualSavings", () => {
  it("computes savings for matching currencies", () => {
    // $95/mo * 12 = $1140, annual $900 -> $240 saved.
    expect(computeAnnualSavings("$95", "$900")).toBe("$240");
    expect(computeAnnualSavings("ZAR110", "ZAR900")).toBe("ZAR420");
  });

  it("parses localized thousands and decimal separators", () => {
    // R100,00/mo * 12 = R1 200,00, annual R1 000,00 -> R200 saved.
    expect(computeAnnualSavings("R100,00", "R1 000,00")).toBe("R200");
  });

  it("returns null when there is no saving", () => {
    expect(computeAnnualSavings("$10", "$200")).toBeNull();
  });

  it("returns null on mismatched currencies or unparseable input", () => {
    expect(computeAnnualSavings("$95", "€900")).toBeNull();
    expect(computeAnnualSavings("$95", undefined)).toBeNull();
    expect(computeAnnualSavings(undefined, undefined)).toBeNull();
  });
});

describe("SubscriptionConfirmDialog", () => {
  const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    offer: chatbotOffer,
    selectedCycle: "monthly" as const,
    onSelectCycle: vi.fn(),
    localizedPrices: {},
    onConfirm: vi.fn(),
  };

  it("renders the confirmation, features, and legal links", () => {
    render(<SubscriptionConfirmDialog {...baseProps} />);

    expect(screen.getByText("Are you sure you want to subscribe to Graft AI Agent?")).toBeInTheDocument();
    // Plan options.
    expect(screen.getByRole("radio", { name: /Monthly/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Annual/ })).toBeInTheDocument();
    // A feature from the catalogue.
    expect(screen.getByText("Website embed included")).toBeInTheDocument();
    // Legal links.
    expect(screen.getByRole("link", { name: "Refund & Cancellation Policy" })).toHaveAttribute("href", "/refunds");
    expect(screen.getByRole("link", { name: "Terms of Use" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
  });

  it("invokes onConfirm when Continue to payment is clicked", () => {
    const onConfirm = vi.fn();
    render(<SubscriptionConfirmDialog {...baseProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Continue to payment" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("invokes onSelectCycle when a plan is chosen", () => {
    const onSelectCycle = vi.fn();
    render(<SubscriptionConfirmDialog {...baseProps} onSelectCycle={onSelectCycle} />);

    fireEvent.click(screen.getByRole("radio", { name: /Annual/ }));
    expect(onSelectCycle).toHaveBeenCalledWith("annual");
  });

  it("disables the CTA while pending", () => {
    render(<SubscriptionConfirmDialog {...baseProps} pending />);
    expect(screen.getByRole("button", { name: "Starting checkout…" })).toBeDisabled();
  });
});
