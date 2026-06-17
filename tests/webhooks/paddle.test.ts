import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Client, WebhookReceipt } from "@/generated/prisma/client";

const mockInngestSend = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

const mockUnmarshal = vi.hoisted(() => vi.fn());

vi.mock("@/lib/paddle", () => ({
  paddle: { webhooks: { unmarshal: mockUnmarshal } },
}));

vi.mock("@/lib/db/prisma", () => ({
  default: {
    client: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    operationalEvent: {
      create: vi.fn().mockResolvedValue({ id: "event-1" }),
    },
    productSpec: {
      update: vi.fn(),
    },
    webhookReceipt: {
      create: vi.fn().mockResolvedValue({ id: "receipt-1" } as unknown as WebhookReceipt),
      findUnique: vi.fn().mockResolvedValue(null),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/inngest/client", () => ({
  inngest: { send: mockInngestSend },
}));

describe("applyPaddleWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubEnv("PADDLE_PRICE_VOICE_MONTHLY", "pri_voice");
    vi.stubEnv("PADDLE_PRICE_BOOKING_MONTHLY", "pri_booking");
  });

  it("activates a client subscription and stores the Paddle customer ID", async () => {
    const { default: prisma } = await import("@/lib/db/prisma");
    const { applyPaddleWebhook } = await import("@/lib/webhooks/paddle");
    vi.mocked(prisma.client.update).mockResolvedValue({
      id: "client-1",
      paddleCustomerId: "ctm_123",
      paddleSubscriptionId: "sub_123",
      subscriptionActive: true,
      subscriptionStatus: "active",
    } as unknown as Client);

    await applyPaddleWebhook({
      data: {
        custom_data: { clientId: "client-1" },
        customer_id: "ctm_123",
        id: "sub_123",
        status: "active",
      },
      event_type: "subscription.activated",
    });

    expect(prisma.client.update).toHaveBeenCalledWith({
      data: expect.objectContaining({
        paddleCustomerId: "ctm_123",
        paddleSubscriptionId: "sub_123",
        subscriptionActive: true,
        subscriptionStatus: "active",
      }),
      where: { id: "client-1" },
    });
  });

  it("updates subscription active state, status, and add-ons from subscription updates", async () => {
    const { default: prisma } = await import("@/lib/db/prisma");
    const { applyPaddleWebhook } = await import("@/lib/webhooks/paddle");
    vi.mocked(prisma.client.update).mockResolvedValue({
      id: "client-1",
      subscriptionActive: true,
      subscriptionAddons: ["pri_voice"],
      subscriptionStatus: "active",
    } as unknown as Client);

    await applyPaddleWebhook({
      data: {
        custom_data: { clientId: "client-1" },
        customer_id: "ctm_123",
        id: "sub_123",
        items: [
          { price: { id: "pri_voice" }, quantity: 1 },
          { price: { id: "pri_chatbot" }, quantity: 1 },
        ],
        status: "active",
      },
      event_type: "subscription.updated",
    });

    expect(prisma.client.update).toHaveBeenCalledWith({
      data: expect.objectContaining({
        paddleCustomerId: "ctm_123",
        paddleSubscriptionId: "sub_123",
        subscriptionActive: true,
        subscriptionAddons: ["pri_voice"],
        subscriptionStatus: "active",
      }),
      where: { id: "client-1" },
    });
  });

  it("resolves lifecycle events by Paddle subscription ID when custom data is absent", async () => {
    const { default: prisma } = await import("@/lib/db/prisma");
    const { applyPaddleWebhook } = await import("@/lib/webhooks/paddle");
    vi.mocked(prisma.client.findFirst).mockResolvedValue({ id: "client-1" } as unknown as Client);
    vi.mocked(prisma.client.update).mockResolvedValue({
      id: "client-1",
      subscriptionActive: false,
      subscriptionStatus: "paused",
    } as unknown as Client);

    await applyPaddleWebhook({
      data: {
        customer_id: "ctm_123",
        id: "sub_123",
        status: "paused",
      },
      event_type: "subscription.paused",
    });

    expect(prisma.client.findFirst).toHaveBeenCalledWith({
      select: { id: true },
      where: { paddleSubscriptionId: "sub_123" },
    });
    expect(prisma.client.update).toHaveBeenCalledWith({
      data: expect.objectContaining({
        paddleCustomerId: "ctm_123",
        paddleSubscriptionId: "sub_123",
        subscriptionActive: false,
        subscriptionStatus: "paused",
      }),
      where: { id: "client-1" },
    });
  });

  it("fails subscription events that cannot be mapped to a client", async () => {
    const { default: prisma } = await import("@/lib/db/prisma");
    const { applyPaddleWebhook } = await import("@/lib/webhooks/paddle");
    vi.mocked(prisma.client.findFirst).mockResolvedValue(null);

    await expect(
      applyPaddleWebhook({
        data: {
          customer_id: "ctm_123",
          id: "sub_123",
          status: "active",
        },
        event_type: "subscription.updated",
      }),
    ).rejects.toThrow("Unable to resolve Paddle subscription sub_123 to a client");
  });
});

describe("POST /api/webhooks/paddle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubEnv("PADDLE_WEBHOOK_SECRET", "test-paddle-secret");
  });

  it("persists a Paddle receipt and dispatches async processing for valid signatures", async () => {
    const { default: prisma } = await import("@/lib/db/prisma");
    const { POST } = await import("@/app/api/webhooks/paddle/route");
    vi.mocked(prisma.webhookReceipt.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.webhookReceipt.create).mockResolvedValue({ id: "receipt-1" } as unknown as WebhookReceipt);
    mockUnmarshal.mockResolvedValue({ eventId: "evt_paddle_1", eventType: "subscription.activated" });

    const body = JSON.stringify({
      data: { custom_data: { clientId: "client-1" }, customer_id: "ctm_123", id: "sub_123", status: "active" },
      event_id: "evt_paddle_1",
      event_type: "subscription.activated",
    });
    const req = new NextRequest("http://localhost/api/webhooks/paddle", {
      body,
      headers: {
        "Content-Type": "application/json",
        "paddle-signature": "ts=1234;h1=mockedsig",
      },
      method: "POST",
    });

    const res = await POST(req);

    expect(res.status).toBe(202);
    expect(prisma.webhookReceipt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: "evt_paddle_1",
          eventType: "subscription.activated",
          provider: "PADDLE",
          signatureVerified: true,
          status: "PENDING",
        }),
      }),
    );
    expect(mockInngestSend).toHaveBeenCalledWith({
      data: { receiptId: "receipt-1" },
      name: "webhook/receipt.created",
    });
  });
});
