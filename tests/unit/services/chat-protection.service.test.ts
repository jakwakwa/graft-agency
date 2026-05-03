import { beforeEach, describe, expect, it, vi } from "vitest";

const getPlatformClientId = vi.fn();

vi.mock("@/lib/auth/resolve-client", () => ({
  getPlatformClientId,
}));

vi.mock("@/lib/db/prisma", () => ({
  default: {
    chatUsage: {
      count: vi.fn(),
      create: vi.fn(),
    },
    client: {
      findFirst: vi.fn(),
    },
    operationalEvent: {
      create: vi.fn(),
    },
  },
}));

describe("chatProtectionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("WIDGET_TOKEN_SECRET", "test-widget-secret-with-enough-entropy");
  });

  it("rejects tenant chat when the signed widget token is missing", async () => {
    const { default: prisma } = await import("@/lib/db/prisma");
    const { chatProtectionService } = await import("@/lib/services/chat-protection.service");

    const result = await chatProtectionService.authorise({
      embedOrigin: "https://example.com",
      requestedClientId: "client-1",
      requestOrigin: "https://graft.today",
      requestReferer: null,
      token: undefined,
    });

    expect(result).toEqual({
      ok: false,
      error: "Widget token is required",
      reason: "MISSING_WIDGET_TOKEN",
      status: 401,
    });
    expect(prisma.client.findFirst).not.toHaveBeenCalled();
    expect(prisma.operationalEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          category: "CHAT",
          eventType: "chat.denied",
          status: "DENIED",
        }),
      }),
    );
  });

  it("authorises active tenant chat when token, origin, entitlement, and quota pass", async () => {
    const { default: prisma } = await import("@/lib/db/prisma");
    const { createWidgetToken } = await import("@/lib/security/widget-token");
    const { chatProtectionService } = await import("@/lib/services/chat-protection.service");

    vi.mocked(prisma.client.findFirst).mockResolvedValue({
      allowedDomains: ["example.com"],
      id: "client-1",
      isPlatformOwner: false,
      subscriptionActive: true,
      subscriptionStatus: "active",
    });
    vi.mocked(prisma.chatUsage.count).mockResolvedValue(0);

    const token = await createWidgetToken({
      clientId: "client-1",
      origin: "https://example.com",
    });

    const result = await chatProtectionService.authorise({
      embedOrigin: "https://example.com",
      requestedClientId: "client-1",
      requestOrigin: "https://graft.today",
      requestReferer: null,
      token,
    });

    expect(result).toEqual({
      ok: true,
      clientId: "client-1",
      isPlatformDemo: false,
    });
    expect(prisma.chatUsage.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          clientId: "client-1",
          status: "ALLOWED",
        }),
      }),
    );
  });

  it("preserves the platform demo exception without requiring a widget token", async () => {
    const { chatProtectionService } = await import("@/lib/services/chat-protection.service");
    getPlatformClientId.mockResolvedValue("platform-client-id");

    const result = await chatProtectionService.authorise({
      embedOrigin: null,
      requestedClientId: "platform",
      requestOrigin: "https://graft.today",
      requestReferer: null,
      token: undefined,
    });

    expect(result).toEqual({
      ok: true,
      clientId: "platform-client-id",
      isPlatformDemo: true,
    });
  });

  it("rejects active tenants once the database-backed chat quota is exhausted", async () => {
    const { default: prisma } = await import("@/lib/db/prisma");
    const { createWidgetToken } = await import("@/lib/security/widget-token");
    const { chatProtectionService } = await import("@/lib/services/chat-protection.service");

    vi.mocked(prisma.client.findFirst).mockResolvedValue({
      allowedDomains: ["example.com"],
      id: "client-1",
      isPlatformOwner: false,
      subscriptionActive: true,
      subscriptionStatus: "active",
    });
    vi.mocked(prisma.chatUsage.count).mockResolvedValue(60);

    const token = await createWidgetToken({
      clientId: "client-1",
      origin: "https://example.com",
    });

    const result = await chatProtectionService.authorise({
      embedOrigin: "https://example.com",
      requestedClientId: "client-1",
      requestOrigin: "https://graft.today",
      requestReferer: null,
      token,
    });

    expect(result).toEqual({
      ok: false,
      clientId: "client-1",
      error: "Chat quota exceeded",
      reason: "RATE_LIMITED",
      status: 429,
    });
  });
});
