import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const findUniqueClient = vi.fn();
const updateClient = vi.fn();
const getSubscription = vi.fn();
const updateSubscription = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth,
}));

vi.mock("@/lib/db/prisma", () => ({
  default: {
    client: {
      findUnique: findUniqueClient,
      update: updateClient,
    },
  },
}));

vi.mock("@/lib/paddle", () => ({
  paddle: {
    subscriptions: {
      get: getSubscription,
      update: updateSubscription,
    },
  },
}));

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/billing/addons", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

const subscribedClient = {
  id: "client-1",
  paddleSubscriptionId: "sub_123",
  subscriptionActive: true,
  subscriptionStatus: "active",
};

describe("POST /api/billing/addons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubEnv("PADDLE_PRICE_VOICE_MONTHLY", "pri_voice");
    vi.stubEnv("PADDLE_PRICE_BOOKING_MONTHLY", "pri_booking");
    auth.mockResolvedValue({ userId: "user-1" });
    findUniqueClient.mockResolvedValue(subscribedClient);
  });

  it("adds an add-on that is not yet on the live subscription", async () => {
    const { POST } = await import("@/app/api/billing/addons/route");
    getSubscription.mockResolvedValue({
      items: [{ price: { id: "pri_chatbot_monthly" }, quantity: 1 }],
    });
    updateSubscription.mockResolvedValue({});
    updateClient.mockResolvedValue({});

    const res = await POST(makeRequest({ priceId: "pri_booking" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, activeAddons: ["pri_booking"] });
    expect(updateSubscription).toHaveBeenCalledWith("sub_123", {
      items: [
        { priceId: "pri_chatbot_monthly", quantity: 1 },
        { priceId: "pri_booking", quantity: 1 },
      ],
      prorationBillingMode: "prorated_next_billing_period",
    });
  });

  it("rejects adding an add-on already on the live subscription — never duplicates", async () => {
    const { POST } = await import("@/app/api/billing/addons/route");
    getSubscription.mockResolvedValue({
      items: [
        { price: { id: "pri_chatbot_monthly" }, quantity: 1 },
        { price: { id: "pri_booking" }, quantity: 1 },
      ],
    });

    const res = await POST(makeRequest({ priceId: "pri_booking" }));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(
      expect.objectContaining({ code: "ADDON_ALREADY_ACTIVE", activeAddons: ["pri_booking"] }),
    );
    expect(updateSubscription).not.toHaveBeenCalled();
    expect(updateClient).not.toHaveBeenCalled();
  });

  it("cannot remove an active add-on — a remove action is ignored and never mutates the subscription", async () => {
    const { POST } = await import("@/app/api/billing/addons/route");
    getSubscription.mockResolvedValue({
      items: [
        { price: { id: "pri_chatbot_monthly" }, quantity: 1 },
        { price: { id: "pri_booking" }, quantity: 1 },
      ],
    });

    const res = await POST(makeRequest({ priceId: "pri_booking", action: "remove" }));

    // The legacy action field is ignored: the add-on is already active, so the
    // request is refused outright and Paddle is never updated.
    expect(res.status).toBe(409);
    expect(updateSubscription).not.toHaveBeenCalled();
    expect(updateClient).not.toHaveBeenCalled();
  });

  it("refuses to activate the voice add-on while it is feature-flagged off", async () => {
    const { POST } = await import("@/app/api/billing/addons/route");

    const res = await POST(makeRequest({ priceId: "pri_voice" }));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(expect.objectContaining({ code: "ADDON_NOT_AVAILABLE" }));
    expect(getSubscription).not.toHaveBeenCalled();
    expect(updateSubscription).not.toHaveBeenCalled();
  });

  it("allows the voice add-on when the feature flag is on", async () => {
    vi.stubEnv("FEATURE_VOICE_ADDON", "true");
    const { POST } = await import("@/app/api/billing/addons/route");
    getSubscription.mockResolvedValue({
      items: [{ price: { id: "pri_chatbot_monthly" }, quantity: 1 }],
    });
    updateSubscription.mockResolvedValue({});
    updateClient.mockResolvedValue({});

    const res = await POST(makeRequest({ priceId: "pri_voice" }));

    expect(res.status).toBe(200);
  });

  it("requires an active base subscription", async () => {
    const { POST } = await import("@/app/api/billing/addons/route");
    findUniqueClient.mockResolvedValue({
      ...subscribedClient,
      subscriptionActive: false,
      subscriptionStatus: "canceled",
    });

    const res = await POST(makeRequest({ priceId: "pri_booking" }));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(expect.objectContaining({ code: "SUBSCRIPTION_REQUIRED" }));
  });

  it("rejects price IDs that are not allowed add-ons", async () => {
    const { POST } = await import("@/app/api/billing/addons/route");

    const res = await POST(makeRequest({ priceId: "pri_chatbot_monthly" }));

    expect(res.status).toBe(400);
  });

  it("requires authentication", async () => {
    const { POST } = await import("@/app/api/billing/addons/route");
    auth.mockResolvedValue({ userId: null });

    const res = await POST(makeRequest({ priceId: "pri_booking" }));

    expect(res.status).toBe(401);
  });
});
