import prisma from "@/lib/db/prisma";
import type { Prisma } from "../../generated/prisma/client";

export type OperationalCategory = "AI_USAGE" | "CHAT" | "SYSTEM" | "WEBHOOK";
export type OperationalStatus = "ALLOWED" | "DENIED" | "ERROR" | "INFO" | "SUCCESS" | "WARNING";

export interface RecordOperationalEventInput {
  category: OperationalCategory;
  clientId?: string;
  eventType: string;
  message?: string;
  metadata?: Prisma.InputJsonValue;
  status: OperationalStatus;
}

export const operationalEventService = {
  async record(input: RecordOperationalEventInput): Promise<void> {
    try {
      await prisma.operationalEvent.create({
        data: {
          category: input.category,
          clientId: input.clientId,
          eventType: input.eventType,
          message: input.message,
          metadata: input.metadata,
          status: input.status,
        },
      });
    } catch (err) {
      console.error("[Operational event] Failed to persist event:", {
        err,
        eventType: input.eventType,
        status: input.status,
      });
    }
  },
};
