import prisma from "@/lib/db/prisma";
import { attioService } from "@/lib/services/attio.service";

type QueueDiagnostics = {
  queueId: string;
  status: "COMPLETED" | "FAILED" | "SKIPPED";
  message?: string;
  companyRecordId?: string;
  personRecordId?: string;
};

type QueueSyncSummary = {
  processed: number;
  completed: number;
  failed: number;
  skipped: number;
  diagnostics: QueueDiagnostics[];
};

function normaliseValue(input: string): string {
  return input.trim().toLowerCase();
}

export function extractRootDomain(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const hostname = new URL(withProtocol).hostname;
    const domain = normaliseValue(hostname)
      .replace(/^www\./, "")
      .replace(/\.$/, "");
    return domain || null;
  } catch {
    return null;
  }
}

async function updateQueueOrThrow(queueId: string, data: Record<string, unknown>) {
  try {
    await prisma.prospectQueue.update({
      where: { id: queueId },
      data,
    });
  } catch (error) {
    console.error("Failed to update prospect queue", { queueId, data, error });
    throw error;
  }
}

export const attioProspectQueueSyncService = {
  async processPendingQueue(input: { clientId: string; take?: number }): Promise<QueueSyncSummary> {
    const take = input.take ?? 50;
    const pendingQueue = await prisma.prospectQueue.findMany({
      where: { clientId: input.clientId, status: "PENDING" },
      include: { lead: true },
      take,
      orderBy: { createdAt: "asc" },
    });

    const summary: QueueSyncSummary = {
      processed: pendingQueue.length,
      completed: 0,
      failed: 0,
      skipped: 0,
      diagnostics: [],
    };

    for (const queueItem of pendingQueue) {
      const leadEmail = queueItem.lead?.email?.trim();
      const domain = extractRootDomain(queueItem.websiteUrl);

      await updateQueueOrThrow(queueItem.id, {
        status: "PROCESSING",
        attempts: { increment: 1 },
        lastAttemptAt: new Date(),
      });

      if (!domain && !leadEmail) {
        await updateQueueOrThrow(queueItem.id, {
          status: "COMPLETED",
          errorMessage: null,
        });
        summary.completed += 1;
        summary.skipped += 1;
        summary.diagnostics.push({
          queueId: queueItem.id,
          status: "SKIPPED",
          message: "No valid website domain or lead email",
        });
        continue;
      }

      try {
        let companyRecordId: string | undefined;
        if (domain) {
          const companyResult = await attioService.assertCompanyRecord({
            values: {
              name: [{ value: queueItem.businessName }],
              domains: [{ domain }],
            },
          });

          if (!companyResult.ok) {
            throw new Error(companyResult.error);
          }
          companyRecordId = companyResult.data.recordId;

          const listResult = await attioService.addToList({ recordId: companyRecordId });
          if ("error" in listResult) {
            throw new Error(listResult.error);
          }
        }

        let personRecordId: string | undefined;
        if (leadEmail) {
          const personResult = await attioService.assertPersonRecord({
            values: {
              email_addresses: [{ email_address: leadEmail }],
              ...(companyRecordId ? { company: [{ target_record_id: companyRecordId }] } : {}),
            },
          });

          if (!personResult.ok) {
            throw new Error(personResult.error);
          }
          personRecordId = personResult.data.recordId;
        }

        await updateQueueOrThrow(queueItem.id, {
          status: "COMPLETED",
          errorMessage: null,
        });
        summary.completed += 1;
        summary.diagnostics.push({
          queueId: queueItem.id,
          status: "COMPLETED",
          companyRecordId,
          personRecordId,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown Attio sync error";
        await updateQueueOrThrow(queueItem.id, {
          status: "FAILED",
          errorMessage: message,
        });
        summary.failed += 1;
        summary.diagnostics.push({
          queueId: queueItem.id,
          status: "FAILED",
          message,
        });
      }
    }

    return summary;
  },
};
