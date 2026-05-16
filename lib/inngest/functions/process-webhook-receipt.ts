import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";
import { webhookReceiptService } from "@/lib/services/webhook-receipt.service";
import { applyCalWebhook } from "@/lib/webhooks/cal";
import { applyClerkOrganizationWebhook } from "@/lib/webhooks/clerk-organizations";
import { applyPaddleWebhook } from "@/lib/webhooks/paddle";
import { applyVercelDeployWebhook } from "@/lib/webhooks/vercel-deploy";

export const processWebhookReceiptFunction = inngest.createFunction(
  {
    id: "process-webhook-receipt",
    name: "Process Webhook Receipt",
    retries: 3,
    idempotency: "event.data.receiptId",
    concurrency: { limit: 5, key: "event.data.receiptId" },
    triggers: [{ event: "webhook/receipt.created" }],
  },
  async ({ event, step }) => {
    const { receiptId } = event.data as { receiptId: string };

    const receipt = await step.run("load-receipt", () =>
      prisma.webhookReceipt.findUnique({
        where: { id: receiptId },
        select: {
          eventType: true,
          id: true,
          payload: true,
          provider: true,
          status: true,
        },
      }),
    );

    if (!receipt) return { skipped: true, reason: "receipt-not-found" };
    if (receipt.status === "PROCESSED") return { skipped: true, reason: "already-processed" };

    await step.run("mark-processing", () => webhookReceiptService.markProcessing(receipt.id));

    try {
      const result = await step.run("apply-provider-handler", () => {
        switch (receipt.provider) {
          case "CAL":
            return applyCalWebhook(receipt.payload as Parameters<typeof applyCalWebhook>[0]);
          case "CLERK":
            return applyClerkOrganizationWebhook(receipt.eventType, receipt.payload);
          case "PADDLE":
            return applyPaddleWebhook(receipt.payload as Parameters<typeof applyPaddleWebhook>[0]);
          case "VERCEL":
            return applyVercelDeployWebhook(receipt.payload as Parameters<typeof applyVercelDeployWebhook>[0]);
          default: {
            const provider: never = receipt.provider;
            throw new Error(`Unsupported webhook provider: ${provider}`);
          }
        }
      });

      await step.run("mark-processed", () => webhookReceiptService.markProcessed(receipt.id));
      return { receiptId: receipt.id, result };
    } catch (err) {
      await step.run("mark-failed", () => webhookReceiptService.markFailed(receipt.id, err));
      throw err;
    }
  },
);
