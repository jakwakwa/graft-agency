import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  default: {
    webhookReceipt: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    operationalEvent: {
      create: vi.fn(),
    },
  },
}));

describe("webhookReceiptService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists a verified webhook receipt before provider processing", async () => {
    const { default: prisma } = await import("@/lib/db/prisma");
    const { webhookReceiptService } = await import("@/lib/services/webhook-receipt.service");
    vi.mocked(prisma.webhookReceipt.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.webhookReceipt.create).mockResolvedValue({
      attempts: 0,
      createdAt: new Date(),
      errorMessage: null,
      eventId: "evt-1",
      eventType: "deployment.ready",
      id: "receipt-1",
      payload: { type: "deployment.ready" },
      processedAt: null,
      provider: "VERCEL",
      receivedAt: new Date(),
      signatureVerified: true,
      status: "PENDING",
      updatedAt: new Date(),
    });

    const result = await webhookReceiptService.recordVerifiedReceipt({
      eventId: "evt-1",
      eventType: "deployment.ready",
      payload: { type: "deployment.ready" },
      provider: "VERCEL",
    });

    expect(result).toEqual({ duplicate: false, receiptId: "receipt-1" });
    expect(prisma.webhookReceipt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: "evt-1",
          eventType: "deployment.ready",
          provider: "VERCEL",
          signatureVerified: true,
          status: "PENDING",
        }),
      }),
    );
  });

  it("does not create a second receipt for duplicate provider event IDs", async () => {
    const { default: prisma } = await import("@/lib/db/prisma");
    const { webhookReceiptService } = await import("@/lib/services/webhook-receipt.service");
    vi.mocked(prisma.webhookReceipt.findUnique).mockResolvedValue({
      attempts: 0,
      createdAt: new Date(),
      errorMessage: null,
      eventId: "evt-1",
      eventType: "deployment.ready",
      id: "receipt-1",
      payload: { type: "deployment.ready" },
      processedAt: null,
      provider: "VERCEL",
      receivedAt: new Date(),
      signatureVerified: true,
      status: "PENDING",
      updatedAt: new Date(),
    });

    const result = await webhookReceiptService.recordVerifiedReceipt({
      eventId: "evt-1",
      eventType: "deployment.ready",
      payload: { type: "deployment.ready" },
      provider: "VERCEL",
    });

    expect(result).toEqual({ duplicate: true, receiptId: "receipt-1" });
    expect(prisma.webhookReceipt.create).not.toHaveBeenCalled();
  });
});
