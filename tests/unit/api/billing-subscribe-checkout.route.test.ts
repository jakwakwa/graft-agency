import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const findFirstClient = vi.fn();
const getSubscription = vi.fn();
const createTransaction = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth,
}));

vi.mock("@/lib/db/prisma", () => ({
  default: {
    client: {
      findFirst: findFirstClient,
    },
  },
}));

vi.mock("@/lib/paddle", () => ({
  paddle: {
    subscriptions: {
      get: getSubscription,
    },
    transactions: {
      create: createTransaction,
    },
  },
}));

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/billing/subscribe/checkout", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

const unsubscribedClient = {
  id: "client-1",
  paddleCustomerId: "ctm_123",
  paddleSubscriptionId: null,
  subscriptionActive: false,
  subscriptionStatus: "inactive",
};

describe("POST /api/billing/subscribe/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubEnv("PADDLE_PRICE_Graft AI Agent_MONTHLY", "pri_Graft AI Agent_monthly");
    vi.stubEnv("PADDLE_PRICE_Graft AI Agent_ANNUAL", "pri_Graft AI Agent_annual");
    auth.mockResolvedValue({ userId: "user-1" });
    findFirstClient.mockResolvedValue(unsubscribedClient);
  });

  it("creates a server-side Paddle transaction for an unsubscribed workspace", async () => {
    const { POST } = await import("@/app/api/billing/subscribe/checkout/route");
    createTransaction.mockResolvedValue({ id: "txn_new" });

    const res = await POST(makeRequest({ priceId: "pri_Graft AI Agent_monthly" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ transactionId: "txn_new" });
    expect(createTransaction).toHaveBeenCalledWith({
      customData: { clientId: "client-1" },
      customerId: "ctm_123",
      items: [{ priceId: "pri_Graft AI Agent_monthly", quantity: 1 }],
    });
  });

  it("rejects checkout when the workspace already has an active subscription", async () => {
    const { POST } = await import("@/app/api/billing/subscribe/checkout/route");
    findFirstClient.mockResolvedValue({
      ...unsubscribedClient,
      paddleSubscriptionId: "sub_existing",
      subscriptionActive: true,
      subscriptionStatus: "active",
    });

    const res = await POST(makeRequest({ priceId: "pri_Graft AI Agent_monthly" }));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(expect.objectContaining({ code: "SUBSCRIPTION_ALREADY_ACTIVE" }));
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it("rejects checkout when local state is stale but the live Paddle subscription is blocking", async () => {
    const { POST } = await import("@/app/api/billing/subscribe/checkout/route");
    findFirstClient.mockResolvedValue({
      ...unsubscribedClient,
      paddleSubscriptionId: "sub_existing",
      subscriptionActive: false,
      subscriptionStatus: "inactive",
    });
    getSubscription.mockResolvedValue({ status: "paused" });

    const res = await POST(makeRequest({ priceId: "pri_Graft AI Agent_monthly" }));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(expect.objectContaining({ code: "SUBSCRIPTION_ALREADY_ACTIVE" }));
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it("allows a new checkout after the previous subscription was canceled", async () => {
    const { POST } = await import("@/app/api/billing/subscribe/checkout/route");
    findFirstClient.mockResolvedValue({
      ...unsubscribedClient,
      paddleSubscriptionId: "sub_old",
      subscriptionActive: false,
      subscriptionStatus: "canceled",
    });
    getSubscription.mockResolvedValue({ status: "canceled" });
    createTransaction.mockResolvedValue({ id: "txn_new" });

    const res = await POST(makeRequest({ priceId: "pri_Graft AI Agent_annual" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ transactionId: "txn_new" });
  });

  it("rejects price IDs that are not base subscriptions", async () => {
    const { POST } = await import("@/app/api/billing/subscribe/checkout/route");

    const res = await POST(makeRequest({ priceId: "pri_voice_monthly" }));

    expect(res.status).toBe(400);
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it("requires authentication", async () => {
    const { POST } = await import("@/app/api/billing/subscribe/checkout/route");
    auth.mockResolvedValue({ userId: null });

    const res = await POST(makeRequest({ priceId: "pri_Graft AI Agent_monthly" }));

    expect(res.status).toBe(401);
  });
});
