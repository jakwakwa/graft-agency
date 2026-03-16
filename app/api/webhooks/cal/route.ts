import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";

function verifyCalSignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret || secret.length === 0) {
    return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const signature = req.headers.get("cal-signature");
  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 401 });
  }

  const body = await req.text();
  if (!verifyCalSignature(body, signature, secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { triggerEvent?: string; payload?: { uid?: string } };
  try {
    payload = JSON.parse(body) as typeof payload;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.triggerEvent !== "BOOKING_CANCELLED") {
    return Response.json({ received: true });
  }

  const uid = payload.payload?.uid;
  if (!uid) {
    return Response.json({ received: true, warning: "No uid in payload" });
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { calBookingUid: uid },
    });
    if (!lead) {
      return Response.json({ received: true, warning: "Lead not found for booking" });
    }

    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 7);

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: "CLOSED",
        nextActionDate: followUpDate,
        chatTranscript: {
          ...(typeof lead.chatTranscript === "object" && lead.chatTranscript !== null
            ? (lead.chatTranscript as Record<string, unknown>)
            : {}),
          bookingCancelledAt: new Date().toISOString(),
        },
      },
    });
    return Response.json({ received: true, updated: lead.id });
  } catch (err) {
    console.error("[Cal webhook] Failed to update lead:", err);
    return Response.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
