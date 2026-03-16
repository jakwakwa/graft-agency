import { tool } from "ai";
import { z } from "zod";
import { calService } from "@/lib/services/cal.service";

export const bookAppointmentTool = tool({
  description: "Books an appointment slot after the visitor confirms.",
  inputSchema: z.object({
    leadId: z.string(),
    slotStart: z.string(),
    slotEnd: z.string(),
    name: z.string(),
    email: z.string(),
    notes: z.string().optional(),
  }),
  execute: async (input) => {
    return await calService.createBooking(input);
  },
});
