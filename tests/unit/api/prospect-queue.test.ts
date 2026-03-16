import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/db/prisma";

const mockAuth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

describe("prospect-queue API", () => {
  let clientId: string;
  let orgId: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    const client = await prisma.client.create({
      data: {
        clerkOrganizationId: `test-org-pq-${Date.now()}`,
        businessName: "Test Client PQ",
      },
    });
    clientId = client.id;
    orgId = client.clerkOrganizationId;
    mockAuth.mockResolvedValue({ orgId });
  });

  afterEach(async () => {
    await prisma.prospectQueue.deleteMany({ where: { clientId } });
    await prisma.client.delete({ where: { id: clientId } });
  });

  describe("GET /api/prospect-queue", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ orgId: null });
      const { GET } = await import("@/app/api/prospect-queue/route");
      const response = await GET(new Request("http://localhost/api/prospect-queue"));
      expect(response.status).toBe(401);
    });

    it("returns empty array when queue is empty", async () => {
      const { GET } = await import("@/app/api/prospect-queue/route");
      const response = await GET(new Request("http://localhost/api/prospect-queue"));
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual([]);
    });

    it("returns queue items for authenticated client", async () => {
      await prisma.prospectQueue.create({
        data: {
          clientId,
          businessName: "Biz One",
          websiteUrl: "https://biz1.example.com",
        },
      });
      const { GET } = await import("@/app/api/prospect-queue/route");
      const response = await GET(new Request("http://localhost/api/prospect-queue"));
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveLength(1);
      expect(json[0].businessName).toBe("Biz One");
      expect(json[0].websiteUrl).toBe("https://biz1.example.com");
    });
  });

  describe("POST /api/prospect-queue", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ orgId: null });
      const { POST } = await import("@/app/api/prospect-queue/route");
      const response = await POST(
        new Request("http://localhost/api/prospect-queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessName: "New Biz",
            websiteUrl: "https://new.example.com",
          }),
        }),
      );
      expect(response.status).toBe(401);
    });

    it("returns 400 when body is invalid", async () => {
      const { POST } = await import("@/app/api/prospect-queue/route");
      const response = await POST(
        new Request("http://localhost/api/prospect-queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessName: "", websiteUrl: "not-a-url" }),
        }),
      );
      expect(response.status).toBe(400);
    });

    it("creates queue item and returns 201", async () => {
      const { POST } = await import("@/app/api/prospect-queue/route");
      const response = await POST(
        new Request("http://localhost/api/prospect-queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessName: "New Biz",
            websiteUrl: "https://new.example.com",
          }),
        }),
      );
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.businessName).toBe("New Biz");
      expect(json.websiteUrl).toBe("https://new.example.com");
      expect(json.clientId).toBe(clientId);
      expect(json.status).toBe("PENDING");
    });
  });
});
