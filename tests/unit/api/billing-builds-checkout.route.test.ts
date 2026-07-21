import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const findFirstClient = vi.fn();
const countBuildPurchases = vi.fn();
const createTransaction = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth,
}));

vi.mock("@/lib/db/prisma", () => ({
  default: {
    buildPurchase: {
      count: countBuildPurchases,
    },
    client: {
      findFirst: findFirstClient,
    },
  },
}));

vi.mock("@/lib/paddle", () => ({
  paddle: {
    transactions: {
      create: createTransaction,
    },
  },
}));

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/billing/builds/checkout", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

describe("POST /api/billing/builds/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubEnv("PADDLE_PRICE_LANDING", "pri_landing");
    vi.stubEnv("PADDLE_PRICE_SMB", "pri_smb");
    auth.mockResolvedValue({ userId: "user-1" });
    findFirstClient.mockResolvedValue({ id: "client-1", paddleCustomerId: "ctm_123" });
  });

  it("creates a server-side Paddle transaction for a purchasable build", async () => {
    const { POST } = await import("@/app/api/billing/builds/checkout/route");
    countBuildPurchases.mockResolvedValue(0);
    createTransaction.mockResolvedValue({ id: "txn_new" });

    const res = await POST(makeRequest({ priceId: "pri_landing" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ transactionId: "txn_new" });
    expect(createTransaction).toHaveBeenCalledWith({
      customData: { clientId: "client-1" },
      customerId: "ctm_123",
      items: [{ priceId: "pri_landing", quantity: 1 }],
    });
  });

  it("rejects a second purchase of the same build within the calendar month", async () => {
    const { POST } = await import("@/app/api/billing/builds/checkout/route");
    countBuildPurchases.mockResolvedValue(1);

    const res = await POST(makeRequest({ priceId: "pri_landing" }));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(
      expect.objectContaining({ code: "BUILD_ALREADY_PURCHASED" }),
    );
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it("rejects price IDs that are not one-time builds", async () => {
    const { POST } = await import("@/app/api/billing/builds/checkout/route");

    const res = await POST(makeRequest({ priceId: "pri_Graft AI Agent_monthly" }));

    expect(res.status).toBe(400);
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it("requires authentication", async () => {
    const { POST } = await import("@/app/api/billing/builds/checkout/route");
    auth.mockResolvedValue({ userId: null });

    const res = await POST(makeRequest({ priceId: "pri_landing" }));

    expect(res.status).toBe(401);
  });
});
