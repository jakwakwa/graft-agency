import { tool } from "ai";
import { z } from "zod";
import { calService } from "@/lib/services/cal.service";

export const checkAvailabilityTool = tool({
  description: "Queries available appointment time slots from the calendar.",
  inputSchema: z.object({
    dateRange: z
      .object({
        from: z.string(),
        to: z.string(),
      })
      .optional(),
    eventTypeId: z.number().optional(),
  }),
  execute: async (input) => {
    return await calService.getAvailability(input);
  },
});
