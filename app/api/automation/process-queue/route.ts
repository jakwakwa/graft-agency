import { requirePlatformAccess } from "@/lib/auth/resolve-client";
import { attioProspectQueueSyncService } from "@/lib/services/attio-prospect-queue-sync.service";

/**
 * Manual trigger for Attio prospect queue processing.
 * Platform-owner or org:admin only.
 */
export async function POST() {
  const result = await requirePlatformAccess();
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { clientId } = result;

  try {
    const data = await attioProspectQueueSyncService.processPendingQueue({
      clientId,
      take: 50,
    });

    return Response.json({
      processed: data.processed,
      completed: data.completed,
      failed: data.failed,
      skipped: data.skipped,
      failureReasons: data.diagnostics
        .filter((entry) => entry.status === "FAILED")
        .map((entry) => entry.message)
        .filter((message): message is string => typeof message === "string"),
      diagnostics: data.diagnostics,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Attio queue processing failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
