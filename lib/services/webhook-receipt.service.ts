import prisma from "@/lib/db/prisma";
import type { Prisma } from "../../generated/prisma/client";
import { operationalEventService } from "./operational-event.service";

export type WebhookProviderName = "CAL" | "CLERK" | "PADDLE" | "VERCEL";
export type WebhookReceiptState = "FAILED" | "PENDING" | "PROCESSED" | "PROCESSING";

interface RecordVerifiedReceiptInput {
  eventId: string;
  eventType: string;
  payload: Prisma.InputJsonValue;
  provider: WebhookProviderName;
}

function isPrismaErrorCode(err: unknown, code: string): boolean {
  return typeof err === "object" && err !== null && "code" in err && err.code === code;
}

export const webhookReceiptService = {
  async recordVerifiedReceipt(input: RecordVerifiedReceiptInput): Promise<{ duplicate: boolean; receiptId: string }> {
    const existing = await prisma.webhookReceipt.findUnique({
      where: {
        provider_eventId: {
          eventId: input.eventId,
          provider: input.provider,
        },
      },
      select: { id: true },
    });

    if (existing) {
      await operationalEventService.record({
        category: "WEBHOOK",
        eventType: "webhook.duplicate",
        metadata: {
          eventId: input.eventId,
          eventType: input.eventType,
          provider: input.provider,
        },
        status: "INFO",
      });
      return { duplicate: true, receiptId: existing.id };
    }

    try {
      const receipt = await prisma.webhookReceipt.create({
        data: {
          eventId: input.eventId,
          eventType: input.eventType,
          payload: input.payload,
          provider: input.provider,
          signatureVerified: true,
          status: "PENDING",
        },
        select: { id: true },
      });
      await operationalEventService.record({
        category: "WEBHOOK",
        eventType: "webhook.received",
        metadata: {
          eventId: input.eventId,
          eventType: input.eventType,
          provider: input.provider,
          receiptId: receipt.id,
        },
        status: "SUCCESS",
      });
      return { duplicate: false, receiptId: receipt.id };
    } catch (err) {
      if (isPrismaErrorCode(err, "P2002")) {
        const duplicate = await prisma.webhookReceipt.findUniqueOrThrow({
          where: {
            provider_eventId: {
              eventId: input.eventId,
              provider: input.provider,
            },
          },
          select: { id: true },
        });
        return { duplicate: true, receiptId: duplicate.id };
      }
      console.error("[Webhook receipt] Failed to persist receipt:", err);
      throw err;
    }
  },

  async markProcessing(receiptId: string): Promise<void> {
    try {
      await prisma.webhookReceipt.update({
        where: { id: receiptId },
        data: {
          attempts: { increment: 1 },
          status: "PROCESSING",
        },
      });
    } catch (err) {
      console.error("[Webhook receipt] Failed to mark processing:", err);
      throw err;
    }
  },

  async markProcessed(receiptId: string): Promise<void> {
    try {
      await prisma.webhookReceipt.update({
        where: { id: receiptId },
        data: {
          errorMessage: null,
          processedAt: new Date(),
          status: "PROCESSED",
        },
      });
    } catch (err) {
      console.error("[Webhook receipt] Failed to mark processed:", err);
      throw err;
    }
  },

  async markFailed(receiptId: string, err: unknown): Promise<void> {
    const message = err instanceof Error ? err.message : "Unknown webhook processing error";
    try {
      await prisma.webhookReceipt.update({
        where: { id: receiptId },
        data: {
          errorMessage: message,
          status: "FAILED",
        },
      });
      await operationalEventService.record({
        category: "WEBHOOK",
        eventType: "webhook.failed",
        message,
        metadata: { receiptId },
        status: "ERROR",
      });
    } catch (updateErr) {
      console.error("[Webhook receipt] Failed to mark failure:", updateErr);
      throw updateErr;
    }
  },
};
