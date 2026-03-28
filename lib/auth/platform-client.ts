import prisma from "@/lib/db/prisma";

/**
 * If `PLATFORM_CLIENT_ID` is set, returns it only when a matching `Client` row exists.
 * Stale or wrong-database UUIDs are ignored so we fall back to org / `isPlatformClient` lookup.
 */
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
      "[resolve-client] PLATFORM_CLIENT_ID is set but no Client exists with that id; ignoring and using PLATFORM_CLERK_ORG_ID / isPlatformClient fallback.",
    );
  }
  return null;
}

/**
 * Returns the platform client ID.
 * Priority: validated PLATFORM_CLIENT_ID > client for PLATFORM_CLERK_ORG_ID > first isPlatformClient.
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
    where: { isPlatformClient: true },
    select: { id: true },
  });
  return client?.id ?? null;
}
