import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Client } from "@/generated/prisma/client";

vi.mock("@/lib/db/cache", () => ({
  cacheTags: {
    client: (id: string) => `client:${id}`,
  },
  invalidateCacheTags: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  default: {
    client: {
      findFirst: vi.fn(),
    },
  },
}));

describe("getClientEntitlements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("grants Graft AI Agent access for an active subscription", async () => {
    const { default: prisma } = await import("@/lib/db/prisma");
    const { getClientEntitlements } = await import("@/lib/billing/entitlements");
    vi.mocked(prisma.client.findFirst).mockResolvedValue({
      isPlatformOwner: false,
      subscriptionActive: true,
      subscriptionAddons: ["pri_voice"],
      subscriptionStatus: "active",
    } as unknown as Client);

    const entitlements = await getClientEntitlements("client-1");

    expect(entitlements).toEqual(
      expect.objectContaining({
        clientId: "client-1",
        exempt: false,
        ChatbotAccess: true,
        subscriptionActive: true,
        subscriptionAddons: ["pri_voice"],
      }),
    );
  });

  it("denies access when subscriptionActive is stale but the status is not entitled", async () => {
    const { default: prisma } = await import("@/lib/db/prisma");
    const { getClientEntitlements } = await import("@/lib/billing/entitlements");
    vi.mocked(prisma.client.findFirst).mockResolvedValue({
      isPlatformOwner: false,
      subscriptionActive: true,
      subscriptionAddons: [],
      subscriptionStatus: "canceled",
    } as unknown as Client);

    const entitlements = await getClientEntitlements("client-1");

    expect(entitlements?.subscriptionActive).toBe(false);
    expect(entitlements?.ChatbotAccess).toBe(false);
  });

  it("exempts platform owners from paygating", async () => {
    const { default: prisma } = await import("@/lib/db/prisma");
    const { getClientEntitlements } = await import("@/lib/billing/entitlements");
    vi.mocked(prisma.client.findFirst).mockResolvedValue({
      isPlatformOwner: true,
      subscriptionActive: false,
      subscriptionAddons: [],
      subscriptionStatus: "inactive",
    } as unknown as Client);

    const entitlements = await getClientEntitlements("client-1");

    expect(entitlements?.exempt).toBe(true);
    expect(entitlements?.ChatbotAccess).toBe(true);
  });

  it("returns null for unknown or soft-deleted clients", async () => {
    const { default: prisma } = await import("@/lib/db/prisma");
    const { getClientEntitlements } = await import("@/lib/billing/entitlements");
    vi.mocked(prisma.client.findFirst).mockResolvedValue(null);

    expect(await getClientEntitlements("missing")).toBeNull();
  });
});

describe("requireActiveSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns null when the workspace is entitled", async () => {
    const { default: prisma } = await import("@/lib/db/prisma");
    const { requireActiveSubscription } = await import("@/lib/billing/entitlements");
    vi.mocked(prisma.client.findFirst).mockResolvedValue({
      isPlatformOwner: false,
      subscriptionActive: true,
      subscriptionAddons: [],
      subscriptionStatus: "active",
    } as unknown as Client);

    expect(await requireActiveSubscription("client-1")).toBeNull();
  });

  it("returns a billing-specific 403 payload for unsubscribed workspaces (invited members included)", async () => {
    const { default: prisma } = await import("@/lib/db/prisma");
    const { requireActiveSubscription, SUBSCRIPTION_REQUIRED_CODE } = await import("@/lib/billing/entitlements");
    vi.mocked(prisma.client.findFirst).mockResolvedValue({
      isPlatformOwner: false,
      subscriptionActive: false,
      subscriptionAddons: [],
      subscriptionStatus: "inactive",
    } as unknown as Client);

    const gate = await requireActiveSubscription("client-1");

    expect(gate).toEqual(
      expect.objectContaining({
        code: SUBSCRIPTION_REQUIRED_CODE,
        status: 403,
      }),
    );
  });
});
