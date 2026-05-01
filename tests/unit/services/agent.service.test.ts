import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import { agentService } from "@/lib/services/agent.service";

vi.mock("@/lib/db/prisma", () => ({
  default: {
    agentConfig: {
      findUnique: vi.fn(),
    },
  },
}));

describe("agentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockAgentConfig(knowledgeBase: Prisma.JsonValue = null) {
    return {
      id: "config-1",
      clientId: "client-1",
      systemPrompt: "You are helpful.",
      knowledgeBase,
      agentName: "Bot",
      greetingMessage: "Hi",
      widgetPrimaryColour: "#000000",
      calComUsername: null,
      defaultEventSlug: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  describe("getConfig", () => {
    it("returns AgentConfig for valid clientId", async () => {
      const { default: prisma } = await import("@/lib/db/prisma");
      const mockConfig = {
        ...mockAgentConfig(),
        agentName: "GRAFT Bot",
        greetingMessage: "Hello!",
      };
      vi.mocked(prisma.agentConfig.findUnique).mockResolvedValue(mockConfig);

      const result = await agentService.getConfig("client-1");
      expect(result).toEqual(mockConfig);
      expect(prisma.agentConfig.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { clientId: "client-1" } }),
      );
    });

    it("returns fallback AgentConfig when clientId not found", async () => {
      const { default: prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.agentConfig.findUnique).mockResolvedValue(null);

      const result = await agentService.getConfig("nonexistent");
      expect(result.clientId).toBe("nonexistent");
      expect(result.systemPrompt.length).toBeGreaterThan(0);
      expect(result.agentName).toBe("AI Assistant");
      expect(result.id).toBe("00000000-0000-4000-8000-000000000001");
    });
  });

  describe("searchKnowledge", () => {
    it("returns matching FAQ entries from knowledgeBase JSON", async () => {
      const { default: prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.agentConfig.findUnique).mockResolvedValue(
        mockAgentConfig([
          { question: "What are your hours?", answer: "9am to 5pm" },
          { question: "Where are you located?", answer: "London" },
        ]),
      );

      const result = await agentService.searchKnowledge({ clientId: "client-1", query: "hours" });
      expect(result.answer).toContain("9am to 5pm");
    });

    it("returns empty result when no match", async () => {
      const { default: prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.agentConfig.findUnique).mockResolvedValue(
        mockAgentConfig([{ question: "What are your hours?", answer: "9am to 5pm" }]),
      );

      const result = await agentService.searchKnowledge({ clientId: "client-1", query: "pricing" });
      expect(result.answer).toBe("");
    });

    it("handles null knowledgeBase gracefully", async () => {
      const { default: prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.agentConfig.findUnique).mockResolvedValue(mockAgentConfig());

      const result = await agentService.searchKnowledge({ clientId: "client-1", query: "anything" });
      expect(result.answer).toBe("");
    });

    it("returns empty result for blank search queries", async () => {
      const { default: prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.agentConfig.findUnique).mockResolvedValue(
        mockAgentConfig([{ question: "What are your hours?", answer: "9am to 5pm" }]),
      );

      const result = await agentService.searchKnowledge({ clientId: "client-1", query: "   " });
      expect(result.answer).toBe("");
    });

    it("ignores malformed knowledge base entries", async () => {
      const { default: prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.agentConfig.findUnique).mockResolvedValue(
        mockAgentConfig([{ question: "What are your hours?", answer: "9am to 5pm" }, { answer: "Missing question" }]),
      );

      const result = await agentService.searchKnowledge({ clientId: "client-1", query: "hours" });
      expect(result.answer).toBe("9am to 5pm");
    });
  });
});
