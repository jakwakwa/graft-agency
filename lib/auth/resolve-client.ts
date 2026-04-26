import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db/prisma";

export { getPlatformClientId } from "@/lib/auth/platform-client";

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
  });
  return client?.id ?? null;
}

/**
 * Returns true if the current user's Client has platform-level access.
 * Grants access to: isPlatformOwner (Jaco) OR isReseller (white-label owners).
 */
export async function hasPlatformAccess(): Promise<boolean> {
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) return false;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { isPlatformOwner: true, isReseller: true },
  });
  return (client?.isPlatformOwner ?? false) || (client?.isReseller ?? false);
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
  });
  return client?.isPlatformOwner ?? false;
}

/**
 * Returns the resolved clientId for the current user if they have platform access.
 * Platform owners and resellers both get their own clientId (data is scoped per client).
 */
export async function requirePlatformAccess(): Promise<
  { clientId: string } | { error: "Unauthorized"; status: 401 } | { error: "Forbidden"; status: 403 }
> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized", status: 401 };

  const client = await prisma.client.findFirst({
    where: { clerkUserId: userId, deletedAt: null },
    select: { id: true, isPlatformOwner: true, isReseller: true },
  });

  if (!client) return { error: "Unauthorized", status: 401 };
  if (!client.isPlatformOwner && !client.isReseller) return { error: "Forbidden", status: 403 };

  return { clientId: client.id };
}
