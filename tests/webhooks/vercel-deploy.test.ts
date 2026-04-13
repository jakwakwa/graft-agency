import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/webhooks/vercel-deploy/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/prisma", () => ({
  default: {
    productSpec: {
      findFirst: vi.fn().mockResolvedValue({ id: "spec-1", leadId: "lead-123", clientId: "client-456" }),
      update: vi.fn().mockResolvedValue({ id: "spec-1" }),
    },
  },
}));

const mockInngestSend = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/inngest/client", () => ({
  inngest: { send: mockInngestSend },
}));

describe("POST /api/webhooks/vercel-deploy", () => {
  it("fires deployment.ready event when deployment is ready", async () => {
    const payload = {
      type: "deployment.ready",
      deployment: { url: "acme-plumbing-abc123.vercel.app", name: "acme-plumbing-abc123" },
    };
    const req = new NextRequest("http://localhost/api/webhooks/vercel-deploy", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "x-vercel-signature": "test-sig",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockInngestSend).toHaveBeenCalledWith(
      expect.objectContaining({ name: "engagement/deployment.ready" }),
    );
  });
});
