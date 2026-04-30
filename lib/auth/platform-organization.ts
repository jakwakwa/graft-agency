import prisma from "@/lib/db/prisma";

export type PlatformOrganizationResolution =
  | { organizationId: string }
  | { error: "Platform organisation is not linked to a Clerk organisation"; status: 500 };

export async function resolvePlatformOrganizationForClient(clientId: string): Promise<PlatformOrganizationResolution> {
  const client = await prisma.client.findFirst({
    where: { id: clientId, deletedAt: null },
    select: { clerkOrganizationId: true },
  });

  if (!client?.clerkOrganizationId) {
    return { error: "Platform organisation is not linked to a Clerk organisation", status: 500 };
  }

  return { organizationId: client.clerkOrganizationId };
}
