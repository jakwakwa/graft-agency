import prisma from "./prisma";

/**
 * Tags scope cache entries created by `cacheStrategy: { tags: [...] }`.
 * Tenant-scoped tags MUST embed the `clientId` to prevent cross-tenant invalidation.
 * Tag rules: alphanumeric + underscore only, max 64 chars, max 5 tags per query / invalidation call.
 */
export const cacheTags = {
  clientByUser: (clerkUserId: string) => `client_by_user_${sanitize(clerkUserId)}`,
  client: (clientId: string) => `client_${sanitize(clientId)}`,
  agentConfig: (clientId: string) => `agent_config_${sanitize(clientId)}`,
} as const;

function sanitize(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]/g, "_");
}

/**
 * Invalidate Accelerate cache entries by tag. Best-effort: in non-Accelerate
 * environments (adapter-backed dev clients) this is a no-op and never throws.
 * Chunks at 5 tags per call (Accelerate API limit).
 */
export async function invalidateCacheTags(tags: readonly string[]): Promise<void> {
  if (tags.length === 0) return;
  const unique = Array.from(new Set(tags));
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 5) chunks.push(unique.slice(i, i + 5));
  for (const chunk of chunks) {
    try {
      await prisma.$accelerate.invalidate({ tags: chunk });
    } catch (err) {
      console.warn("[cache] invalidate failed (non-fatal):", err);
    }
  }
}
