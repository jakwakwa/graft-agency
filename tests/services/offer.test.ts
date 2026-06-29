import { describe, it, expect, vi } from "vitest";
import {
  createWebsiteBuildTransaction,
  sendCampaignDraftToOwner,
  sendOfferEmail,
} from "@/lib/services/offer.service";

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

// Capture every Resend send payload so tests can assert recipient + body.
const sentEmails: Array<{ from: string; to: string; subject: string; html: string }> = [];
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function Resend() {
    return {
      emails: {
        send: vi.fn().mockImplementation((payload) => {
          sentEmails.push(payload);
          return Promise.resolve({ data: { id: "email-sent-id" } });
        }),
      },
    };
  }),
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

  it("sendCampaignDraftToOwner addresses the owner and embeds the prospect, demo, and checkout", async () => {
    sentEmails.length = 0;
    await sendCampaignDraftToOwner({
      ownerEmail: "owner@graft.today",
      prospectEmail: "jane@acme.com",
      prospectName: "Jane Smith",
      companyName: "Acme Plumbing",
      refinedSubject: "A quick idea for Acme Plumbing",
      refinedBody: "Hi Jane,\nWe built something for you.",
      deploymentUrl: "https://acme-plumbing.onrender.com",
      checkoutUrl: "https://checkout.paddle.com/checkout/txn_test_abc123",
    });

    expect(sentEmails).toHaveLength(1);
    const sent = sentEmails[0]!;
    // Goes to the owner for review, NOT the prospect.
    expect(sent.to).toBe("owner@graft.today");
    expect(sent.subject).toContain("Acme Plumbing");
    // The prospect address, live demo, and checkout link are all present for forwarding.
    expect(sent.html).toContain("jane@acme.com");
    expect(sent.html).toContain("https://acme-plumbing.onrender.com");
    expect(sent.html).toContain("https://checkout.paddle.com/checkout/txn_test_abc123");
    // Newlines in the draft body are rendered.
    expect(sent.html).toContain("Hi Jane,<br>We built something for you.");
  });
});
