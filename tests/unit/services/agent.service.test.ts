import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import { agentService, isSyntheticAgentConfig, PLATFORM_LANDING_WIDGET_DEFAULTS } from "@/lib/services/agent.service";

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
    vi.stubEnv("CAL_USER_USERNAME", "");
    vi.stubEnv("CAL_USER_EVENT_SLUG", "");
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
      widgetSecondaryColour: null,
      calComUsername: null,
      defaultEventSlug: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  describe("PLATFORM_LANDING_WIDGET_DEFAULTS", () => {
    it("contains expected default values", () => {
      expect(PLATFORM_LANDING_WIDGET_DEFAULTS).toEqual({
        agentName: "GRAFT",
        greetingMessage: "Hi! I'm GRAFT AI Assistant — how can I help you today?",
        widgetPrimaryColour: "#E49B57",
        widgetSecondaryColour: "#2A2118",
      });
    });
  });

  describe("isSyntheticAgentConfig", () => {
    it("returns true for fallback config id", () => {
      const syntheticConfig = { id: "00000000-0000-4000-8000-000000000001" } as any;
      expect(isSyntheticAgentConfig(syntheticConfig)).toBe(true);
    });

    it("returns false for regular config id", () => {
      const regularConfig = { id: "regular-uuid-123" } as any;
      expect(isSyntheticAgentConfig(regularConfig)).toBe(false);
    });
  });

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

    it("uses saved Cal.com settings before environment defaults", async () => {
      vi.stubEnv("CAL_USER_USERNAME", "env-user");
      vi.stubEnv("CAL_USER_EVENT_SLUG", "env-slug");
      const { default: prisma } = await import("@/lib/db/prisma");
      const mockConfig = {
        ...mockAgentConfig(),
        calComUsername: "client-user",
        defaultEventSlug: "client-slug",
      };
      vi.mocked(prisma.agentConfig.findUnique).mockResolvedValue(mockConfig);

      const result = await agentService.getConfig("client-1");

      expect(result.calComUsername).toBe("client-user");
      expect(result.defaultEventSlug).toBe("client-slug");
    });

    it("falls back to environment Cal.com settings when saved config is missing them", async () => {
      vi.stubEnv("CAL_USER_USERNAME", "env-user");
      vi.stubEnv("CAL_USER_EVENT_SLUG", "env-slug");
      const { default: prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.agentConfig.findUnique).mockResolvedValue(mockAgentConfig());

      const result = await agentService.getConfig("client-1");

      expect(result.calComUsername).toBe("env-user");
      expect(result.defaultEventSlug).toBe("env-slug");
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
