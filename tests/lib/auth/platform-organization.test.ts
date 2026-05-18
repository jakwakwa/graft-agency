import { describe, expect, it, vi, beforeEach } from "vitest";
import { resolvePlatformOrganizationForClient } from "@/lib/auth/platform-organization";
import prisma from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  default: {
    client: {
      findFirst: vi.fn(),
    },
  },
}));

describe("resolvePlatformOrganizationForClient", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return organizationId if client has clerkOrganizationId", async () => {
    vi.mocked(prisma.client.findFirst).mockResolvedValue({
      clerkOrganizationId: "org_123",
    } as any);

    const result = await resolvePlatformOrganizationForClient("client_1");

    expect(prisma.client.findFirst).toHaveBeenCalledWith({
      where: { id: "client_1", deletedAt: null },
      select: { clerkOrganizationId: true },
    });
    expect(result).toEqual({ organizationId: "org_123" });
  });

  it("should return error if client does not exist", async () => {
    vi.mocked(prisma.client.findFirst).mockResolvedValue(null);

    const result = await resolvePlatformOrganizationForClient("client_2");

    expect(prisma.client.findFirst).toHaveBeenCalledWith({
      where: { id: "client_2", deletedAt: null },
      select: { clerkOrganizationId: true },
    });
    expect(result).toEqual({
      error: "Platform organisation is not linked to a Clerk organisation",
      status: 500,
    });
  });

  it("should return error if client exists but has no clerkOrganizationId", async () => {
    vi.mocked(prisma.client.findFirst).mockResolvedValue({
      clerkOrganizationId: null,
    } as any);

    const result = await resolvePlatformOrganizationForClient("client_3");

    expect(prisma.client.findFirst).toHaveBeenCalledWith({
      where: { id: "client_3", deletedAt: null },
      select: { clerkOrganizationId: true },
    });
    expect(result).toEqual({
      error: "Platform organisation is not linked to a Clerk organisation",
      status: 500,
    });
  });
});
