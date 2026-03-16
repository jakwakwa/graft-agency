import { beforeEach, describe, expect, it, vi } from "vitest";
import { leadService } from "@/lib/services/lead.service";

vi.mock("@/lib/db/prisma", () => ({
  default: {
    lead: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("leadService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createFromChat", () => {
    it("creates a Lead with source INBOUND", async () => {
      const { default: prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.lead.create).mockResolvedValue({
        id: "lead-123",
        clientId: "client-1",
        customerName: "Alice",
        email: "alice@example.com",
        phone: null,
        source: "INBOUND",
        status: "SCRAPED",
        scrapedData: null,
        chatTranscript: null,
        calBookingUid: null,
        nextActionDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await leadService.createFromChat({
        clientId: "client-1",
        name: "Alice",
        email: "alice@example.com",
      });

      expect(prisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ source: "INBOUND" }),
        }),
      );
      expect(result).toHaveProperty("id");
    });

    it("links lead to correct clientId", async () => {
      const { default: prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.lead.create).mockResolvedValue({
        id: "lead-456",
        clientId: "client-2",
        customerName: "Bob",
        email: "bob@example.com",
        phone: null,
        source: "INBOUND",
        status: "SCRAPED",
        scrapedData: null,
        chatTranscript: null,
        calBookingUid: null,
        nextActionDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await leadService.createFromChat({
        clientId: "client-2",
        name: "Bob",
        email: "bob@example.com",
      });

      expect(prisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ clientId: "client-2" }),
        }),
      );
    });

    it("returns the created lead ID", async () => {
      const { default: prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.lead.create).mockResolvedValue({
        id: "lead-789",
        clientId: "client-1",
        customerName: "Charlie",
        email: null,
        phone: "+44123",
        source: "INBOUND",
        status: "SCRAPED",
        scrapedData: null,
        chatTranscript: null,
        calBookingUid: null,
        nextActionDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await leadService.createFromChat({
        clientId: "client-1",
        name: "Charlie",
        phone: "+44123",
      });
      expect(result.id).toBe("lead-789");
    });
  });

  describe("flagForHandoff", () => {
    it("updates lead status", async () => {
      const { default: prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.lead.update).mockResolvedValue({
        id: "lead-123",
        clientId: "client-1",
        customerName: "Alice",
        email: "alice@example.com",
        phone: null,
        source: "INBOUND",
        status: "CONTACTED",
        scrapedData: null,
        chatTranscript: null,
        calBookingUid: null,
        nextActionDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await leadService.flagForHandoff({
        leadId: "lead-123",
        reason: "Complex query",
        urgency: "high",
      });

      expect(prisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "lead-123" },
        }),
      );
    });

    it("records handoff reason", async () => {
      const { default: prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.lead.update).mockResolvedValue({
        id: "lead-123",
        clientId: "client-1",
        customerName: "Alice",
        email: null,
        phone: null,
        source: "INBOUND",
        status: "CONTACTED",
        scrapedData: null,
        chatTranscript: { handoffReason: "Customer is upset" },
        calBookingUid: null,
        nextActionDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await leadService.flagForHandoff({
        leadId: "lead-123",
        reason: "Customer is upset",
        urgency: "medium",
      });

      expect(result).toEqual(expect.objectContaining({ status: "flagged" }));
    });
  });
});
