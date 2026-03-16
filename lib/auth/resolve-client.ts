import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db/prisma";

/**
 * Resolves clientId from the current user's Clerk org.
 * Returns null if user is not in an org or no Client exists for that org.
 */
export async function resolveClientIdFromAuth(): Promise<string | null> {
  const { orgId } = await auth();
  if (!orgId) return null;

  const client = await prisma.client.findUnique({
    where: { clerkOrganizationId: orgId },
    select: { id: true },
  });
  return client?.id ?? null;
}
