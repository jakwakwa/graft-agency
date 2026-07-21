import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/db/prisma";

const mockAuth = vi.fn();
const mockClerkClient = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({ auth: () => mockAuth(), clerkClient: () => mockClerkClient() }));

afterEach(() => {
  vi.unstubAllEnvs();
  mockClerkClient.mockReset();
});

describe("resolveClientIdFromAuth", () => {
  afterEach(() => vi.clearAllMocks());

  it("provisions a regular client from current Clerk organisation membership when the webhook was missed", async () => {
    const orgId = `org-rci-${Date.now()}`;
    const clerkUserId = `user-rci-member-${Date.now()}`;
    const owner = await prisma.client.create({
      data: { businessName: "Platform", clerkOrganizationId: orgId, isPlatformOwner: true },
    });
    vi.stubEnv("PLATFORM_CLIENT_ID", owner.id);
    mockAuth.mockResolvedValue({ userId: clerkUserId });
    mockClerkClient.mockResolvedValue({
      organizations: {
        getOrganizationMembershipList: vi.fn().mockResolvedValue({
          data: [
            {
              publicUserData: {
                userId: clerkUserId,
                firstName: "Test",
                lastName: "Member",
                identifier: "test.member@example.com",
              },
            },
          ],
        }),
      },
    });

    try {
      const { resolveClientIdFromAuth } = await import("@/lib/auth/resolve-client");
      const clientId = await resolveClientIdFromAuth();

      expect(clientId).toEqual(expect.any(String));
      const client = await prisma.client.findUnique({ where: { clerkUserId } });
      expect(client).toMatchObject({
        id: clientId,
        businessName: "Test Member",
        email: "test.member@example.com",
        clerkOrganizationId: orgId,
        isPlatformOwner: false,
        deletedAt: null,
      });
    } finally {
      await prisma.client.deleteMany({ where: { OR: [{ clerkUserId }, { id: owner.id }] } });
    }
  });
});

describe("requirePlatformAccess", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns clientId for isPlatformOwner client", async () => {
    const clerkUserId = `user-rpa-owner-${Date.now()}`;
    const client = await prisma.client.create({
      data: { clerkUserId, businessName: "Owner", isPlatformOwner: true, clerkOrganizationId: "org-1" },
    });
    mockAuth.mockResolvedValue({ userId: clerkUserId });
    const { requirePlatformAccess } = await import("@/lib/auth/resolve-client");
    const result = await requirePlatformAccess();
    expect(result).toEqual({ clientId: client.id });
    await prisma.client.delete({ where: { id: client.id } });
  });

  it("returns 403 for Graft AI Agent-only client", async () => {
    const clerkUserId = `user-rpa-Graft AI Agent-${Date.now()}`;
    const client = await prisma.client.create({
      data: { clerkUserId, businessName: "Graft AI Agent Client", clerkOrganizationId: "org-1" },
    });
    mockAuth.mockResolvedValue({ userId: clerkUserId });
    const { requirePlatformAccess } = await import("@/lib/auth/resolve-client");
    const result = await requirePlatformAccess();
    expect(result).toEqual({ error: "Forbidden", status: 403 });
    await prisma.client.delete({ where: { id: client.id } });
  });

  it("returns 401 when user has no session", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const { requirePlatformAccess } = await import("@/lib/auth/resolve-client");
    const result = await requirePlatformAccess();
    expect(result).toEqual({ error: "Unauthorized", status: 401 });
  });

  it("returns 401 for a soft-deleted client", async () => {
    const clerkUserId = `user-rpa-deleted-${Date.now()}`;
    const client = await prisma.client.create({
      data: {
        clerkUserId,
        businessName: "Deleted Client",
        isPlatformOwner: true,
        deletedAt: new Date(),
        clerkOrganizationId: "org-1",
      },
    });
    mockAuth.mockResolvedValue({ userId: clerkUserId });
    const { requirePlatformAccess } = await import("@/lib/auth/resolve-client");
    const result = await requirePlatformAccess();
    expect(result).toEqual({ error: "Unauthorized", status: 401 });
    await prisma.client.delete({ where: { id: client.id } });
  });
});

describe("hasPlatformAccess", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns true for isPlatformOwner", async () => {
    const clerkUserId = `user-hpa-owner-${Date.now()}`;
    const client = await prisma.client.create({
      data: { clerkUserId, businessName: "Owner", isPlatformOwner: true, clerkOrganizationId: "org-1" },
    });
    mockAuth.mockResolvedValue({ userId: clerkUserId });
    const { hasPlatformAccess } = await import("@/lib/auth/resolve-client");
    expect(await hasPlatformAccess()).toBe(true);
    await prisma.client.delete({ where: { id: client.id } });
  });

  it("returns false for Graft AI Agent-only client", async () => {
    const clerkUserId = `user-hpa-Graft AI Agent-${Date.now()}`;
    const client = await prisma.client.create({
      data: { clerkUserId, businessName: "Graft AI Agent", clerkOrganizationId: "org-1" },
    });
    mockAuth.mockResolvedValue({ userId: clerkUserId });
    const { hasPlatformAccess } = await import("@/lib/auth/resolve-client");
    expect(await hasPlatformAccess()).toBe(false);
    await prisma.client.delete({ where: { id: client.id } });
  });
});

describe("ChatbotAccess", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns true only for isPlatformOwner", async () => {
    const clerkUserId = `user-hca-owner-${Date.now()}`;
    const client = await prisma.client.create({
      data: { clerkUserId, businessName: "Owner", isPlatformOwner: true, clerkOrganizationId: "org-1" },
    });
    mockAuth.mockResolvedValue({ userId: clerkUserId });
    const { ChatbotAccess } = await import("@/lib/auth/resolve-client");
    expect(await ChatbotAccess()).toBe(true);
    await prisma.client.delete({ where: { id: client.id } });
  });
});
