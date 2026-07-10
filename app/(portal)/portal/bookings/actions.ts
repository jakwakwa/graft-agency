"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirectToAccessRequired, requireAuthOrSignIn } from "@/lib/auth/guards";
import { resolveClientIdFromAuth } from "@/lib/auth/resolve-client";
import { requireActiveSubscription } from "@/lib/billing/entitlements";
import { calService } from "@/lib/services/cal.service";

const cancelBookingSchema = z.object({
  bookingUid: z.string().trim().min(1, "Booking UID is required"),
  cancellationReason: z.string().trim().min(1).max(500).optional(),
});

export interface CancelBookingActionResult {
  success: boolean;
  error?: string;
}

export async function cancelBookingAction(input: unknown): Promise<CancelBookingActionResult> {
  await requireAuthOrSignIn();

  const clientId = await resolveClientIdFromAuth();
  if (!clientId) redirectToAccessRequired();

  const gate = await requireActiveSubscription(clientId);
  if (gate) return { success: false, error: gate.error };

  const parsed = cancelBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid cancellation request" };
  }

  const result = await calService.cancelBooking({
    bookingUid: parsed.data.bookingUid,
    cancellationReason: parsed.data.cancellationReason ?? "Cancelled from GRAFT Portal",
  });

  if ("error" in result) {
    return { success: false, error: result.error };
  }

  revalidatePath("/portal/bookings");

  return { success: true };
}
