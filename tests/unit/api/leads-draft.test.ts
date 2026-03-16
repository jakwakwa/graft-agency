import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/db/prisma";

const mockAuth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

describe("leads API (DRAFT_PENDING)", () => {
  let clientId: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    const client = await prisma.client.create({
      data: {
        clerkOrganizationId: `test-org-leads-${Date.now()}`,
        businessName: "Test Client Leads",
      },
    });
    clientId = client.id;
    mockAuth.mockResolvedValue({ orgId: client.clerkOrganizationId });
  });

  afterEach(async () => {
    await prisma.lead.deleteMany({ where: { clientId } });
    await prisma.client.delete({ where: { id: clientId } });
  });

  describe("GET /api/leads?status=DRAFT_PENDING", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ orgId: null });
      const { GET } = await import("@/app/api/leads/route");
      const response = await GET(new Request("http://localhost/api/leads"));
      expect(response.status).toBe(401);
    });

    it("returns DRAFT_PENDING leads for authenticated client", async () => {
      await prisma.lead.create({
        data: {
          clientId,
          customerName: "Prospect Co",
          source: "OUTBOUND_PROSPECT",
          status: "DRAFT_PENDING",
          scrapedData: { draftSubject: "Hi", draftBody: "Hello" },
        },
      });
      const { GET } = await import("@/app/api/leads/route");
      const response = await GET(new Request("http://localhost/api/leads?status=DRAFT_PENDING"));
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveLength(1);
      expect(json[0].status).toBe("DRAFT_PENDING");
      expect(json[0].customerName).toBe("Prospect Co");
    });

    it("returns empty array when no DRAFT_PENDING leads", async () => {
      const { GET } = await import("@/app/api/leads/route");
      const response = await GET(new Request("http://localhost/api/leads"));
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual([]);
    });
  });

  describe("PATCH /api/leads/[id]", () => {
    it("approves draft by updating status to CONTACTED", async () => {
      const lead = await prisma.lead.create({
        data: {
          clientId,
          customerName: "Prospect Co",
          source: "OUTBOUND_PROSPECT",
          status: "DRAFT_PENDING",
        },
      });
      const { PATCH } = await import("@/app/api/leads/[id]/route");
      const response = await PATCH(
        new Request("http://localhost/api/leads/123", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "CONTACTED" }),
        }),
        { params: Promise.resolve({ id: lead.id }) },
      );
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.status).toBe("CONTACTED");
    });

    it("returns 404 when lead not found", async () => {
      const { PATCH } = await import("@/app/api/leads/[id]/route");
      const response = await PATCH(
        new Request("http://localhost/api/leads/00000000-0000-0000-0000-000000000000", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "CONTACTED" }),
        }),
        { params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }) },
      );
      expect(response.status).toBe(404);
    });
  });
});
