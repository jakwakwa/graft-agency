import { requirePlatformAccess } from "@/lib/auth/resolve-client";
import { processQueue } from "@/lib/services/outbound.service";

/**
 * Manual trigger for the prospecting pipeline.
 * Platform-owner or org:admin only. Same logic as the cron job.
 */
export async function POST() {
  const result = await requirePlatformAccess();
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  const data = await processQueue();
  return Response.json(data);
}
