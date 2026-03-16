import type { QueueStatus } from "@/generated/prisma/client";

/**
 * Input for creating a single prospect queue row (POST /api/prospect-queue).
 * Address is optional for display; not persisted on ProspectQueue model.
 */
export interface CreateProspectQueueInput {
  businessName: string;
  websiteUrl: string;
  address?: string;
}

/**
 * Input for patching a prospect queue row (PATCH /api/prospect-queue/[id]).
 */
export interface PatchProspectQueueInput {
  businessName?: string;
  websiteUrl?: string;
  status?: QueueStatus;
}

/**
 * Prospect queue item as returned by list/CRUD APIs.
 */
export interface ProspectQueueItem {
  id: string;
  clientId: string | null;
  leadId: string | null;
  businessName: string;
  websiteUrl: string;
  status: QueueStatus;
  attempts: number;
  lastAttemptAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Valid status transitions for ProspectQueue.
 * PENDING -> PROCESSING (cron claim)
 * PENDING -> CANCELED (user cancel)
 * PROCESSING -> COMPLETED | FAILED (cron result)
 */
export const VALID_QUEUE_STATUS_TRANSITIONS: Record<QueueStatus, QueueStatus[]> = {
  PENDING: ["PROCESSING", "CANCELED"],
  PROCESSING: ["COMPLETED", "FAILED"],
  COMPLETED: [],
  FAILED: ["PENDING"],
  CANCELED: [],
} as const;
