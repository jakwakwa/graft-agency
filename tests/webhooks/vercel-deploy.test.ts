import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/webhooks/vercel-deploy/route";

const mockInngestSend = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/lib/db/prisma", () => ({
  default: {
    webhookReceipt: {
      create: vi.fn().mockResolvedValue({ id: "receipt-1" }),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/inngest/client", () => ({
  inngest: { send: mockInngestSend },
}));

describe("POST /api/webhooks/vercel-deploy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VERCEL_WEBHOOK_SECRET", "test-vercel-secret");
  });

  it("rejects requests when VERCEL_WEBHOOK_SECRET is not configured", async () => {
    vi.stubEnv("VERCEL_WEBHOOK_SECRET", "");

    const req = new NextRequest("http://localhost/api/webhooks/vercel-deploy", {
      body: JSON.stringify({ type: "deployment.ready" }),
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(mockInngestSend).not.toHaveBeenCalled();
  });

  it("persists a receipt and dispatches async processing when deployment is ready", async () => {
    const payload = {
      id: "evt-vercel-1",
      type: "deployment.ready",
      deployment: { id: "dpl_123", url: "acme-plumbing-abc123.vercel.app", name: "acme-plumbing-abc123" },
    };
    const body = JSON.stringify(payload);
    const signature = createHmac("sha256", "test-vercel-secret").update(body).digest("hex");
    const req = new NextRequest("http://localhost/api/webhooks/vercel-deploy", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        "x-vercel-signature": signature,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(202);
    expect(mockInngestSend).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { receiptId: "receipt-1" },
        name: "webhook/receipt.created",
      }),
    );
  });
});
