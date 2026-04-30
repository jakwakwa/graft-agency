import { afterEach, describe, expect, it } from "vitest";
import { resolvePlatformOrganizationForClient } from "@/lib/auth/platform-organization";
import prisma from "@/lib/db/prisma";

describe("resolvePlatformOrganizationForClient", () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    if (createdIds.length > 0) {
      await prisma.client.deleteMany({ where: { id: { in: createdIds } } });
      createdIds.length = 0;
    }
  });

  it("uses the authenticated platform client's Clerk organisation instead of global env configuration", async () => {
    const clientOrgId = `org-client-${Date.now()}`;
    const client = await prisma.client.create({
      data: {
        businessName: "Platform Owner",
        clerkOrganizationId: clientOrgId,
        isPlatformOwner: true,
      },
    });
    createdIds.push(client.id);

    await expect(resolvePlatformOrganizationForClient(client.id)).resolves.toEqual({
      organizationId: clientOrgId,
    });
  });

  it("returns a configuration error when the platform client is not linked to Clerk", async () => {
    const client = await prisma.client.create({
      data: {
        businessName: "Platform Owner Without Org",
        isPlatformOwner: true,
      },
    });
    createdIds.push(client.id);

    await expect(resolvePlatformOrganizationForClient(client.id)).resolves.toEqual({
      error: "Platform organisation is not linked to a Clerk organisation",
      status: 500,
    });
  });
});
