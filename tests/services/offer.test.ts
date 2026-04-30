import { describe, it, expect, vi } from "vitest";
import { createWebsiteBuildTransaction, sendOfferEmail } from "@/lib/services/offer.service";

vi.mock("@/lib/paddle", () => ({
  paddle: {
    transactions: {
      create: vi.fn().mockResolvedValue({
        id: "txn_test_abc123",
        checkout: { url: "https://checkout.paddle.com/checkout/txn_test_abc123" },
      }),
    },
  },
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "email-sent-id" } }),
    },
  })),
}));

describe("offer service", () => {
  it("createWebsiteBuildTransaction returns transactionId and checkoutUrl", async () => {
    process.env.PADDLE_PRICE_LANDING = "pri_test_landing";
    process.env.PADDLE_PRICE_SMB = "pri_test_smb";

    const result = await createWebsiteBuildTransaction({
      leadId: "lead-123",
      productSpecId: "spec-456",
      clientId: "client-789",
      buildType: "smb",
    });

    expect(result.transactionId).toBe("txn_test_abc123");
    expect(result.checkoutUrl).toContain("checkout.paddle.com");
  });

  it("sendOfferEmail sends without throwing", async () => {
    await sendOfferEmail({
      toEmail: "jane@acme.com",
      toName: "Jane Smith",
      companyName: "Acme Plumbing",
      buildType: "smb",
      deploymentUrl: "https://acme-plumbing-abc123.vercel.app",
      checkoutUrl: "https://checkout.paddle.com/checkout/txn_test_abc123",
      painPoints: ["Manual job scheduling", "No online quoting"],
    });
  });
});
