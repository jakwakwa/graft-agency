import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPlatformClientId as resolvePlatformClientId } from "@/lib/auth/platform-client";
import { cacheTags } from "@/lib/db/cache";
import prisma from "@/lib/db/prisma";

export { getPlatformClientId } from "@/lib/auth/platform-client";

async function provisionClientFromPlatformMembership(userId: string): Promise<string | null> {
  const platformClientId = await resolvePlatformClientId();
  if (!platformClientId) return null;

  const platformClient = await prisma.client.findFirst({
    where: { id: platformClientId, deletedAt: null },
    select: { clerkOrganizationId: true },
  });
  if (!platformClient?.clerkOrganizationId) return null;

  const clerk = await clerkClient();
  const memberships = await clerk.organizations.getOrganizationMembershipList({
    organizationId: platformClient.clerkOrganizationId,
  });
  const membership = memberships.data.find((item) => item.publicUserData?.userId === userId);
  if (!membership?.publicUserData) return null;

  const firstName = membership.publicUserData.firstName ?? "";
  const lastName = membership.publicUserData.lastName ?? "";
  const email = membership.publicUserData.identifier;
  const businessName = `${firstName} ${lastName}`.trim() || email || "New Client";

  try {
    const client = await prisma.client.upsert({
      where: { clerkUserId: userId },
      create: {
        clerkUserId: userId,
        clerkOrganizationId: platformClient.clerkOrganizationId,
        businessName,
        email,
      },
      update: {
        clerkOrganizationId: platformClient.clerkOrganizationId,
        email,
        deletedAt: null,
      },
      select: { id: true },
    });
    return client.id;
  } catch (err) {
    console.error("[resolve-client] Failed to provision Clerk organisation member:", err);
    return null;
  }
}

/**
 * Resolves clientId from the current user's Clerk userId.
 * Returns null if no Client exists for that user.
 */
export async function resolveClientIdFromAuth(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const client = await prisma.client.findFirst({
    where: { clerkUserId: userId, deletedAt: null },
    select: { id: true },
    cacheStrategy: {
      ttl: 60,
      swr: 300,
      tags: [cacheTags.clientByUser(userId)],
    },
  });
  if (client) return client.id;

  return provisionClientFromPlatformMembership(userId);
}

/**
 * Returns true if the current user's Client has platform-level access.
 * Only the platform owner has elevated dashboard access.
 */
export async function hasPlatformAccess(): Promise<boolean> {
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) return false;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { isPlatformOwner: true },
    cacheStrategy: {
      ttl: 60,
      swr: 300,
      tags: [cacheTags.client(clientId)],
    },
  });
  return client?.isPlatformOwner ?? false;
}

/**
 * Returns true if the current user's Client has chatbot access.
 * Only the platform owner (Jaco) can configure chatbot agents.
 */
export async function hasChatbotAccess(): Promise<boolean> {
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) return false;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { isPlatformOwner: true },
    cacheStrategy: {
      ttl: 60,
      swr: 300,
      tags: [cacheTags.client(clientId)],
    },
  });
  return client?.isPlatformOwner ?? false;
}

/**
 * Returns the resolved clientId for the current user if they have platform access.
 * Only the platform owner has elevated dashboard access.
 */
export async function requirePlatformAccess(): Promise<
  { clientId: string } | { error: "Unauthorized"; status: 401 } | { error: "Forbidden"; status: 403 }
> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized", status: 401 };

  const client = await prisma.client.findFirst({
    where: { clerkUserId: userId, deletedAt: null },
    select: { id: true, isPlatformOwner: true },
    cacheStrategy: {
      ttl: 60,
      swr: 300,
      tags: [cacheTags.clientByUser(userId)],
    },
  });

  if (!client) return { error: "Unauthorized", status: 401 };
  if (!client.isPlatformOwner) return { error: "Forbidden", status: 403 };

  return { clientId: client.id };
}

export async function requirePlatformOwnerAccess(): Promise<
  { clientId: string } | { error: "Unauthorized"; status: 401 } | { error: "Forbidden"; status: 403 }
> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized", status: 401 };

  const client = await prisma.client.findFirst({
    where: { clerkUserId: userId, deletedAt: null },
    select: { id: true, isPlatformOwner: true },
    cacheStrategy: {
      ttl: 60,
      swr: 300,
      tags: [cacheTags.clientByUser(userId)],
    },
  });

  if (!client) return { error: "Unauthorized", status: 401 };
  if (!client.isPlatformOwner) return { error: "Forbidden", status: 403 };

  return { clientId: client.id };
}
