import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/db/prisma";

const mockAuth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({ auth: () => mockAuth() }));

describe("requirePlatformAccess", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns clientId for isPlatformOwner client", async () => {
    const client = await prisma.client.create({
      data: { clerkOrganizationId: `test-rpa-owner-${Date.now()}`, businessName: "Owner", isPlatformOwner: true },
    });
    mockAuth.mockResolvedValue({ orgId: client.clerkOrganizationId });
    const { requirePlatformAccess } = await import("@/lib/auth/resolve-client");
    const result = await requirePlatformAccess();
    expect(result).toEqual({ clientId: client.id });
    await prisma.client.delete({ where: { id: client.id } });
  });

  it("returns clientId for isReseller client", async () => {
    const client = await prisma.client.create({
      data: { clerkOrganizationId: `test-rpa-reseller-${Date.now()}`, businessName: "Reseller", isReseller: true },
    });
    mockAuth.mockResolvedValue({ orgId: client.clerkOrganizationId });
    const { requirePlatformAccess } = await import("@/lib/auth/resolve-client");
    const result = await requirePlatformAccess();
    expect(result).toEqual({ clientId: client.id });
    await prisma.client.delete({ where: { id: client.id } });
  });

  it("returns 403 for chatbot-only client", async () => {
    const client = await prisma.client.create({
      data: { clerkOrganizationId: `test-rpa-chatbot-${Date.now()}`, businessName: "Chatbot Client" },
    });
    mockAuth.mockResolvedValue({ orgId: client.clerkOrganizationId });
    const { requirePlatformAccess } = await import("@/lib/auth/resolve-client");
    const result = await requirePlatformAccess();
    expect(result).toEqual({ error: "Forbidden", status: 403 });
    await prisma.client.delete({ where: { id: client.id } });
  });

  it("returns 401 when user has no org", async () => {
    mockAuth.mockResolvedValue({ orgId: null });
    const { requirePlatformAccess } = await import("@/lib/auth/resolve-client");
    const result = await requirePlatformAccess();
    expect(result).toEqual({ error: "Unauthorized", status: 401 });
  });

  it("returns 401 for a soft-deleted org", async () => {
    const client = await prisma.client.create({
      data: {
        clerkOrganizationId: `test-rpa-deleted-${Date.now()}`,
        businessName: "Deleted Org",
        isPlatformOwner: true,
        deletedAt: new Date(),
      },
    });
    mockAuth.mockResolvedValue({ orgId: client.clerkOrganizationId });
    const { requirePlatformAccess } = await import("@/lib/auth/resolve-client");
    const result = await requirePlatformAccess();
    expect(result).toEqual({ error: "Unauthorized", status: 401 });
    await prisma.client.delete({ where: { id: client.id } });
  });
});

describe("hasPlatformAccess", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns true for isPlatformOwner", async () => {
    const client = await prisma.client.create({
      data: { clerkOrganizationId: `test-hpa-owner-${Date.now()}`, businessName: "Owner", isPlatformOwner: true },
    });
    mockAuth.mockResolvedValue({ orgId: client.clerkOrganizationId });
    const { hasPlatformAccess } = await import("@/lib/auth/resolve-client");
    expect(await hasPlatformAccess()).toBe(true);
    await prisma.client.delete({ where: { id: client.id } });
  });

  it("returns true for isReseller", async () => {
    const client = await prisma.client.create({
      data: { clerkOrganizationId: `test-hpa-reseller-${Date.now()}`, businessName: "Reseller", isReseller: true },
    });
    mockAuth.mockResolvedValue({ orgId: client.clerkOrganizationId });
    const { hasPlatformAccess } = await import("@/lib/auth/resolve-client");
    expect(await hasPlatformAccess()).toBe(true);
    await prisma.client.delete({ where: { id: client.id } });
  });

  it("returns false for chatbot-only client", async () => {
    const client = await prisma.client.create({
      data: { clerkOrganizationId: `test-hpa-chatbot-${Date.now()}`, businessName: "Chatbot" },
    });
    mockAuth.mockResolvedValue({ orgId: client.clerkOrganizationId });
    const { hasPlatformAccess } = await import("@/lib/auth/resolve-client");
    expect(await hasPlatformAccess()).toBe(false);
    await prisma.client.delete({ where: { id: client.id } });
  });
});

describe("hasChatbotAccess", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns true only for isPlatformOwner", async () => {
    const client = await prisma.client.create({
      data: { clerkOrganizationId: `test-hca-owner-${Date.now()}`, businessName: "Owner", isPlatformOwner: true },
    });
    mockAuth.mockResolvedValue({ orgId: client.clerkOrganizationId });
    const { hasChatbotAccess } = await import("@/lib/auth/resolve-client");
    expect(await hasChatbotAccess()).toBe(true);
    await prisma.client.delete({ where: { id: client.id } });
  });

  it("returns false for isReseller", async () => {
    const client = await prisma.client.create({
      data: { clerkOrganizationId: `test-hca-reseller-${Date.now()}`, businessName: "Reseller", isReseller: true },
    });
    mockAuth.mockResolvedValue({ orgId: client.clerkOrganizationId });
    const { hasChatbotAccess } = await import("@/lib/auth/resolve-client");
    expect(await hasChatbotAccess()).toBe(false);
    await prisma.client.delete({ where: { id: client.id } });
  });
});
