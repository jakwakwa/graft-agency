import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/db/prisma";

const mockAuth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({ auth: () => mockAuth() }));

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

  it("returns clientId for isReseller client", async () => {
    const clerkUserId = `user-rpa-reseller-${Date.now()}`;
    const client = await prisma.client.create({
      data: { clerkUserId, businessName: "Reseller", isReseller: true, clerkOrganizationId: "org-1" },
    });
    mockAuth.mockResolvedValue({ userId: clerkUserId });
    const { requirePlatformAccess } = await import("@/lib/auth/resolve-client");
    const result = await requirePlatformAccess();
    expect(result).toEqual({ clientId: client.id });
    await prisma.client.delete({ where: { id: client.id } });
  });

  it("returns 403 for chatbot-only client", async () => {
    const clerkUserId = `user-rpa-chatbot-${Date.now()}`;
    const client = await prisma.client.create({
      data: { clerkUserId, businessName: "Chatbot Client", clerkOrganizationId: "org-1" },
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

  it("returns true for isReseller", async () => {
    const clerkUserId = `user-hpa-reseller-${Date.now()}`;
    const client = await prisma.client.create({
      data: { clerkUserId, businessName: "Reseller", isReseller: true, clerkOrganizationId: "org-1" },
    });
    mockAuth.mockResolvedValue({ userId: clerkUserId });
    const { hasPlatformAccess } = await import("@/lib/auth/resolve-client");
    expect(await hasPlatformAccess()).toBe(true);
    await prisma.client.delete({ where: { id: client.id } });
  });

  it("returns false for chatbot-only client", async () => {
    const clerkUserId = `user-hpa-chatbot-${Date.now()}`;
    const client = await prisma.client.create({
      data: { clerkUserId, businessName: "Chatbot", clerkOrganizationId: "org-1" },
    });
    mockAuth.mockResolvedValue({ userId: clerkUserId });
    const { hasPlatformAccess } = await import("@/lib/auth/resolve-client");
    expect(await hasPlatformAccess()).toBe(false);
    await prisma.client.delete({ where: { id: client.id } });
  });
});

describe("hasChatbotAccess", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns true only for isPlatformOwner", async () => {
    const clerkUserId = `user-hca-owner-${Date.now()}`;
    const client = await prisma.client.create({
      data: { clerkUserId, businessName: "Owner", isPlatformOwner: true, clerkOrganizationId: "org-1" },
    });
    mockAuth.mockResolvedValue({ userId: clerkUserId });
    const { hasChatbotAccess } = await import("@/lib/auth/resolve-client");
    expect(await hasChatbotAccess()).toBe(true);
    await prisma.client.delete({ where: { id: client.id } });
  });

  it("returns false for isReseller", async () => {
    const clerkUserId = `user-hca-reseller-${Date.now()}`;
    const client = await prisma.client.create({
      data: { clerkUserId, businessName: "Reseller", isReseller: true, clerkOrganizationId: "org-1" },
    });
    mockAuth.mockResolvedValue({ userId: clerkUserId });
    const { hasChatbotAccess } = await import("@/lib/auth/resolve-client");
    expect(await hasChatbotAccess()).toBe(false);
    await prisma.client.delete({ where: { id: client.id } });
  });
});
