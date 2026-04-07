import { auth } from "@clerk/nextjs/server";
import { getPlatformClientId } from "@/lib/auth/platform-client";
import prisma from "@/lib/db/prisma";

export { getPlatformClientId } from "@/lib/auth/platform-client";

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

/**
 * Returns true if the user has org:admin role (full platform access).
 */
export async function isPlatformAdmin(): Promise<boolean> {
  const { has, orgRole } = await auth();
  return (typeof has === "function" && has({ role: "org:admin" })) || orgRole === "org:admin";
}

/**
 * Resolves effective clientId for platform-scoped operations.
 * Org admins get full access (platform client). Others must match platform client.
 */
export async function requirePlatformAccess(): Promise<
  { clientId: string } | { error: "Unauthorized"; status: 401 } | { error: "Forbidden"; status: 403 }
> {
  const { orgId, has, orgRole } = await auth();
  if (!orgId) return { error: "Unauthorized", status: 401 };

  const isAdmin = (typeof has === "function" && has({ role: "org:admin" })) || orgRole === "org:admin";
  if (isAdmin) {
    const platformId = await getPlatformClientId();
    if (platformId) return { clientId: platformId };
    const adminClientId = await resolveClientIdFromAuth();
    if (adminClientId) return { clientId: adminClientId };
    return { error: "Forbidden", status: 403 };
  }

  const clientId = await resolveClientIdFromAuth();
  if (!clientId) return { error: "Unauthorized", status: 401 };

  const platformId = await getPlatformClientId();
  if (!platformId || clientId !== platformId) return { error: "Forbidden", status: 403 };

  return { clientId };
}
