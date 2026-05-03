import { headers } from "next/headers";
import { Webhook } from "svix";
import { inngest } from "@/lib/inngest/client";
import { webhookReceiptService } from "@/lib/services/webhook-receipt.service";
import type { Prisma } from "../../../../generated/prisma/client";

/**
 * Clerk → Graft sync for members and agency.
 * Configure in Clerk Dashboard → Webhooks → endpoint URL `/api/webhooks/clerk`
 * and subscribe to:
 * - organization.created (bootstrap)
 * - organizationMembership.created (provision client)
 * - organizationMembership.deleted (soft-delete client)
 */
export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return Response.json({ error: "CLERK_WEBHOOK_SECRET is not configured" }, { status: 500 });
  }

  const h = await headers();
  const svixId = h.get("svix-id");
  const svixTimestamp = h.get("svix-timestamp");
  const svixSignature = h.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return Response.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  const body = await req.text();
  let evt: { type: string; data: unknown };
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: unknown };
  } catch {
    return Response.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    const receipt = await webhookReceiptService.recordVerifiedReceipt({
      eventId: svixId,
      eventType: evt.type,
      payload: JSON.parse(JSON.stringify(evt.data)) as Prisma.InputJsonValue,
      provider: "CLERK",
    });

    if (!receipt.duplicate) {
      await inngest.send({
        name: "webhook/receipt.created",
        data: { receiptId: receipt.receiptId },
      });
    }

    return Response.json({ duplicate: receipt.duplicate, ok: true }, { status: 202 });
  } catch (err) {
    console.error("[Clerk webhook] Failed to persist receipt:", err);
    return Response.json({ error: "Failed to persist webhook receipt" }, { status: 500 });
  }
}
