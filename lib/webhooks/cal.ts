import prisma from "@/lib/db/prisma";

interface CalWebhookPayload {
  payload?: {
    uid?: string;
  };
  triggerEvent?: string;
}

export async function applyCalWebhook(payload: CalWebhookPayload): Promise<unknown> {
  if (payload.triggerEvent !== "BOOKING_CANCELLED") {
    return { received: true };
  }

  const uid = payload.payload?.uid;
  if (!uid) {
    return { received: true, warning: "No uid in payload" };
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { calBookingUid: uid },
    });
    if (!lead) {
      return { received: true, warning: "Lead not found for booking" };
    }

    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 7);

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        chatTranscript: {
          ...(typeof lead.chatTranscript === "object" && lead.chatTranscript !== null
            ? (lead.chatTranscript as Record<string, unknown>)
            : {}),
          bookingCancelledAt: new Date().toISOString(),
        },
        nextActionDate: followUpDate,
        status: "CLOSED",
      },
    });
    return { received: true, updated: lead.id };
  } catch (err) {
    console.error("[Cal webhook] Failed to update lead:", err);
    throw err;
  }
}
