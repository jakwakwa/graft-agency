import { describe, it, expect, vi } from "vitest";
import { createProductOffer, sendOfferEmail } from "@/lib/services/offer.service";

vi.mock("@paddle/paddle-node-sdk", () => ({
  Paddle: vi.fn().mockImplementation(() => ({
    products: {
      create: vi.fn().mockResolvedValue({ id: "pro_test_abc123" }),
    },
    prices: {
      create: vi.fn().mockResolvedValue({ id: "pri_test_xyz456" }),
    },
  })),
  Environment: { sandbox: "sandbox", production: "production" },
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "email-sent-id" } }),
    },
  })),
}));

describe("offer service", () => {
  it("createProductOffer returns paddle IDs and checkout URL", async () => {
    const result = await createProductOffer({
      productName: "Acme Plumbing Booking Portal",
      description: "Automated booking and quoting system",
      priceGBP: 497,
    });
    expect(result.productId).toContain("pro_");
    expect(result.priceId).toContain("pri_");
    expect(result.checkoutUrl).toContain("checkout");
  });

  it("sendOfferEmail sends without throwing", async () => {
    await sendOfferEmail({
      toEmail: "jane@acme.com",
      toName: "Jane Smith",
      companyName: "Acme Plumbing",
      productName: "Acme Plumbing Booking Portal",
      deploymentUrl: "https://acme-plumbing-abc123.vercel.app",
      checkoutUrl: "https://checkout.paddle.com/checkout/pri_test_xyz456",
      priceGBP: 497,
      painPoints: ["Manual job scheduling", "No online quoting"],
    });
  });
});
