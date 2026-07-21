import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/db/prisma";

describe("getPlatformClientId", () => {
  const createdIds: string[] = [];

  beforeEach(async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("PLATFORM_CLIENT_ID", "");
    vi.stubEnv("PLATFORM_CLERK_ORG_ID", "");
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    if (createdIds.length > 0) {
      await prisma.client.deleteMany({ where: { id: { in: createdIds } } });
      createdIds.length = 0;
    }
  });

  it("ignores PLATFORM_CLIENT_ID when no Client row exists and falls back to isPlatformOwner", async () => {
    const platform = await prisma.client.create({
      data: {
        clerkOrganizationId: `test-gpc-${Date.now()}`,
        businessName: "Platform",
        isPlatformOwner: true,
      },
    });
    createdIds.push(platform.id);

    vi.stubEnv("PLATFORM_CLIENT_ID", "00000000-0000-0000-0000-000000000001");
    vi.stubEnv("PLATFORM_CLERK_ORG_ID", "");

    const { getPlatformClientId } = await import("@/lib/auth/platform-client");
    const id = await getPlatformClientId();
    expect(id).not.toBeNull();
    if (id === null) {
      throw new Error("expected getPlatformClientId to return a client id");
    }
    // Newest isPlatformOwner wins when multiple exist (shared dev DB).
    expect(id).toBe(platform.id);
    const row = await prisma.client.findUnique({ where: { id } });
    expect(row?.isPlatformOwner).toBe(true);
  });

  it("uses PLATFORM_CLIENT_ID when it matches a Client row", async () => {
    const c = await prisma.client.create({
      data: {
        clerkOrganizationId: `test-gpc-${Date.now()}`,
        businessName: "Explicit",
      },
    });
    createdIds.push(c.id);

    vi.stubEnv("PLATFORM_CLIENT_ID", c.id);
    vi.stubEnv("PLATFORM_CLERK_ORG_ID", "");

    const { getPlatformClientId } = await import("@/lib/auth/platform-client");
    const id = await getPlatformClientId();
    expect(id).toBe(c.id);
  });

  it("prefers isPlatformOwner when PLATFORM_CLERK_ORG_ID matches multiple Clients", async () => {
    const orgId = `test-gpc-org-${Date.now()}`;
    const member = await prisma.client.create({
      data: {
        clerkOrganizationId: orgId,
        businessName: "Member (created first)",
        isPlatformOwner: false,
      },
    });
    const owner = await prisma.client.create({
      data: {
        clerkOrganizationId: orgId,
        businessName: "Platform Owner",
        isPlatformOwner: true,
      },
    });
    createdIds.push(member.id, owner.id);

    vi.stubEnv("PLATFORM_CLIENT_ID", "");
    vi.stubEnv("PLATFORM_CLERK_ORG_ID", orgId);

    const { getPlatformClientId } = await import("@/lib/auth/platform-client");
    const id = await getPlatformClientId();
    expect(id).toBe(owner.id);
  });
});
