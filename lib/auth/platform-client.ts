import prisma from "@/lib/db/prisma";

async function resolvePlatformClientIdFromEnv(): Promise<string | null> {
  const raw = process.env.PLATFORM_CLIENT_ID?.trim();
  if (!raw) return null;

  const row = await prisma.client.findUnique({
    where: { id: raw },
    select: { id: true },
  });
  if (row) return row.id;

  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[resolve-client] PLATFORM_CLIENT_ID is set but no Client exists with that id; ignoring and using PLATFORM_CLERK_ORG_ID / isPlatformOwner fallback.",
    );
  }
  return null;
}

/**
 * Returns the platform owner's client ID.
 * Priority: validated PLATFORM_CLIENT_ID > client for PLATFORM_CLERK_ORG_ID > first isPlatformOwner.
 */
export async function getPlatformClientId(): Promise<string | null> {
  const fromEnv = await resolvePlatformClientIdFromEnv();
  if (fromEnv) return fromEnv;

  const orgId = process.env.PLATFORM_CLERK_ORG_ID;
  if (orgId) {
    const client = await prisma.client.findUnique({
      where: { clerkOrganizationId: orgId },
      select: { id: true },
    });
    if (client) return client.id;
  }

  const client = await prisma.client.findFirst({
    where: { isPlatformOwner: true },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return client?.id ?? null;
}
