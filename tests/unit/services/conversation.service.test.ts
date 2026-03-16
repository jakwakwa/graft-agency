import { beforeEach, describe, expect, it, vi } from "vitest";
import { conversationService } from "@/lib/services/conversation.service";

vi.mock("@/lib/db/prisma", () => ({
  default: {
    conversation: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("conversationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("save", () => {
    it("creates a new conversation with messages JSON", async () => {
      const { default: prisma } = await import("@/lib/db/prisma");
      const messages = [{ role: "user", content: "Hello" }];
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.conversation.create).mockResolvedValue({
        id: "convo-1",
        clientId: "client-1",
        leadId: null,
        messages,
        sessionId: "session-abc",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await conversationService.save({
        clientId: "client-1",
        sessionId: "session-abc",
        messages,
      });

      expect(prisma.conversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ messages }),
        }),
      );
    });

    it("updates existing conversation by sessionId", async () => {
      const { default: prisma } = await import("@/lib/db/prisma");
      const updatedMessages = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
      ];
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        clientId: "client-1",
      });
      vi.mocked(prisma.conversation.update).mockResolvedValue({
        id: "convo-1",
        clientId: "client-1",
        leadId: null,
        messages: updatedMessages,
        sessionId: "session-abc",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await conversationService.save({
        clientId: "client-1",
        sessionId: "session-abc",
        messages: updatedMessages,
      });

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        data: { messages: updatedMessages },
        where: { sessionId: "session-abc" },
      });
    });

    it("rejects updates when a session belongs to another client", async () => {
      const { default: prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        clientId: "client-2",
      });

      await expect(
        conversationService.save({
          clientId: "client-1",
          sessionId: "session-abc",
          messages: [{ role: "user", content: "Hello" }],
        }),
      ).rejects.toThrow('Conversation session "session-abc" belongs to a different client');
    });
  });

  describe("findBySession", () => {
    it("returns conversation for valid sessionId", async () => {
      const { default: prisma } = await import("@/lib/db/prisma");
      const mockConvo = {
        id: "convo-1",
        clientId: "client-1",
        leadId: null,
        messages: [{ role: "user", content: "Hello" }],
        sessionId: "session-abc",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.conversation.findFirst).mockResolvedValue(mockConvo);

      const result = await conversationService.findBySession({
        clientId: "client-1",
        sessionId: "session-abc",
      });
      expect(result).toEqual(mockConvo);
    });

    it("returns null for unknown sessionId", async () => {
      const { default: prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.conversation.findFirst).mockResolvedValue(null);

      const result = await conversationService.findBySession({
        clientId: "client-1",
        sessionId: "nonexistent",
      });
      expect(result).toBeNull();
    });
  });
});
