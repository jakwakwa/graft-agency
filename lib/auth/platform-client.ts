import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/db/prisma";

function isMissingTableError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

async function resolvePlatformClientIdFromEnv(): Promise<string | null> {
  const raw = process.env.PLATFORM_CLIENT_ID?.trim();
  if (!raw) return null;

  const row = await prisma.client.findFirst({
    where: {
      OR: [{ id: raw }, { clerkUserId: raw }],
    },
    select: { id: true },
  });
  if (row) return row.id;

  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[resolve-client] PLATFORM_CLIENT_ID is set but no Client exists with that id or clerkUserId; ignoring and using PLATFORM_CLERK_ORG_ID / isPlatformOwner fallback.",
    );
  }
  return null;
}

/**
 * Returns the platform owner's client ID.
 * Priority: validated PLATFORM_CLIENT_ID > client for PLATFORM_CLERK_ORG_ID > first isPlatformOwner.
 */
export async function getPlatformClientId(): Promise<string | null> {
  try {
    const fromEnv = await resolvePlatformClientIdFromEnv();
    if (fromEnv) return fromEnv;

    const orgId = process.env.PLATFORM_CLERK_ORG_ID;
    if (orgId) {
      const client = await prisma.client.findFirst({
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
  } catch (error) {
    // Empty / unmigrated DBs (e.g. brand-new Prisma Postgres) must not fail SSG of `/`.
    if (isMissingTableError(error)) {
      console.warn("[resolve-client] clients table missing — returning null until migrations are applied.");
      return null;
    }
    throw error;
  }
}
