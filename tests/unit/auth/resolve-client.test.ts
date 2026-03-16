import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/db/prisma";

const mockAuth = vi.fn();
const mockGetPlatformClientId = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));
vi.mock("@/lib/auth/resolve-client", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/auth/resolve-client")>();
  return {
    ...mod,
    getPlatformClientId: mockGetPlatformClientId,
  };
});

describe("requirePlatformAccess", () => {
  let platformClientId: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    const client = await prisma.client.create({
      data: {
        clerkOrganizationId: `test-org-resolve-${Date.now()}`,
        businessName: "Platform Client",
        isPlatformClient: true,
      },
    });
    platformClientId = client.id;
    mockGetPlatformClientId.mockResolvedValue(platformClientId);
  });

  afterEach(async () => {
    await prisma.client.deleteMany({ where: { id: platformClientId } });
  });

  it("returns clientId when user has org:admin role (has)", async () => {
    mockAuth.mockResolvedValue({ orgId: "any-org", has: () => true });
    const { requirePlatformAccess } = await import("@/lib/auth/resolve-client");
    const result = await requirePlatformAccess();
    expect(result).toEqual({ clientId: platformClientId });
  });

  it("returns clientId when user has orgRole org:admin (fallback)", async () => {
    mockAuth.mockResolvedValue({ orgId: "any-org", orgRole: "org:admin", has: () => false });
    const { requirePlatformAccess } = await import("@/lib/auth/resolve-client");
    const result = await requirePlatformAccess();
    expect(result).toEqual({ clientId: platformClientId });
  });

  it("returns clientId when admin and getPlatformClientId null but org has client", async () => {
    mockGetPlatformClientId.mockResolvedValue(null);
    const client = await prisma.client.findUniqueOrThrow({ where: { id: platformClientId } });
    mockAuth.mockResolvedValue({ orgId: client.clerkOrganizationId, orgRole: "org:admin" });
    const { requirePlatformAccess } = await import("@/lib/auth/resolve-client");
    const result = await requirePlatformAccess();
    expect(result).toEqual({ clientId: platformClientId });
  });

  it("returns 401 when user has no org", async () => {
    mockAuth.mockResolvedValue({ orgId: null, has: () => false });
    const { requirePlatformAccess } = await import("@/lib/auth/resolve-client");
    const result = await requirePlatformAccess();
    expect(result).toEqual({ error: "Unauthorized", status: 401 });
  });

  it("returns clientId when user's org matches platform client", async () => {
    const client = await prisma.client.findUniqueOrThrow({
      where: { id: platformClientId },
    });
    mockAuth.mockResolvedValue({ orgId: client.clerkOrganizationId, has: () => false });
    const { requirePlatformAccess } = await import("@/lib/auth/resolve-client");
    const result = await requirePlatformAccess();
    expect(result).toEqual({ clientId: platformClientId });
  });

  it("returns 403 when user's org does not match platform client", async () => {
    const otherClient = await prisma.client.create({
      data: {
        clerkOrganizationId: `other-org-${Date.now()}`,
        businessName: "Other Client",
      },
    });
    mockAuth.mockResolvedValue({ orgId: otherClient.clerkOrganizationId, has: () => false });
    const { requirePlatformAccess } = await import("@/lib/auth/resolve-client");
    const result = await requirePlatformAccess();
    expect(result).toEqual({ error: "Forbidden", status: 403 });
    await prisma.client.delete({ where: { id: otherClient.id } });
  });
});
