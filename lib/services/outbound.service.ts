import { Prisma, type ProspectQueue } from "@/generated/prisma/client";
import prisma from "@/lib/db/prisma";
import { leadService } from "@/lib/services/lead.service";

const BATCH_SIZE = Number(process.env.PROSPECTING_BATCH_SIZE) || 5;

/**
 * Claims a batch of PENDING prospects atomically using FOR UPDATE SKIP LOCKED.
 * Returns locked rows and sets status to PROCESSING.
 */
export async function claimQueueBatch(batchSize: number = BATCH_SIZE): Promise<ProspectQueue[]> {
  return prisma.$transaction(async (tx) => {
    const items = await tx.$queryRaw<
      Array<{
        id: string;
        client_id: string | null;
        lead_id: string | null;
        business_name: string;
        website_url: string;
        status: string;
        attempts: number;
        last_attempt_at: Date | null;
        error_message: string | null;
        created_at: Date;
        updated_at: Date;
      }>
    >(Prisma.sql`
      SELECT * FROM prospect_queue
      WHERE status = 'PENDING'
      ORDER BY created_at DESC
      LIMIT ${batchSize}
      FOR UPDATE SKIP LOCKED
    `);

    if (items.length === 0) return [];

    const ids = items.map((i) => i.id);
    await tx.prospectQueue.updateMany({
      where: { id: { in: ids } },
      data: { status: "PROCESSING", lastAttemptAt: new Date() },
    });

    return tx.prospectQueue.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: "desc" },
    });
  });
}

/**
 * Processes a single queue item: scrape → draft → create Lead (DRAFT_PENDING) → mark COMPLETED/FAILED.
 * Stub implementation: creates Lead with DRAFT_PENDING and marks queue COMPLETED.
 * Full scrape/draft integration in future iteration.
 */
export async function processQueueItem(item: ProspectQueue): Promise<{ success: boolean; error?: string }> {
  try {
    const clientId = item.clientId;
    if (!clientId) {
      await prisma.prospectQueue.update({
        where: { id: item.id },
        data: {
          status: "FAILED",
          errorMessage: "Missing clientId",
          attempts: { increment: 1 },
        },
      });
      return { success: false, error: "Missing clientId" };
    }

    const lead = await leadService.createFromOutbound({
      clientId,
      customerName: item.businessName,
      websiteUrl: item.websiteUrl,
      draftSubject: `Re: ${item.businessName}`,
      draftBody: `Hi, we'd love to connect with ${item.businessName}.`,
    });

    await prisma.prospectQueue.update({
      where: { id: item.id },
      data: {
        status: "COMPLETED",
        leadId: lead.id,
        attempts: { increment: 1 },
      },
    });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    try {
      await prisma.prospectQueue.update({
        where: { id: item.id },
        data: {
          status: "FAILED",
          errorMessage: message,
          attempts: { increment: 1 },
        },
      });
    } catch {
      // Record may have been deleted (e.g. by parallel test cleanup)
    }
    return { success: false, error: message };
  }
}

/**
 * Runs the prospecting pipeline: claim batch, process each item sequentially.
 */
export async function processQueue(): Promise<{
  processedCount: number;
  message: string;
}> {
  const batch = await claimQueueBatch();
  if (batch.length === 0) {
    return { processedCount: 0, message: "Queue is empty. No prospects to process." };
  }

  let processedCount = 0;
  for (const item of batch) {
    const result = await processQueueItem(item);
    if (result.success) processedCount++;
  }

  return {
    processedCount,
    message: `Processed ${processedCount} of ${batch.length} prospects.`,
  };
}
