import { tool } from "ai";
import { z } from "zod";
import { calService } from "@/lib/services/cal.service";

export const createReserveSlotTool = (clientId: string) =>
  tool({
    description: "Temporarily reserves a slot in the calendar to prevent others from booking it while the visitor is finishing the booking process. Defaults to 5 minutes.",
    inputSchema: z.object({
      eventTypeId: z.number().describe("The ID of the event type"),
      slotStart: z.string().describe("ISO 8601 datestring in UTC representing the available slot start time"),
      slotDuration: z.number().optional().describe("Slot duration in minutes (optional, defaults to event type length)"),
      reservationDuration: z.number().optional().describe("How many minutes the slot should be reserved for (defaults to 5 minutes)"),
    }),
    execute: async (input) => {
      return await calService.reserveSlot({
        eventTypeId: input.eventTypeId,
        slotStart: input.slotStart,
        slotDuration: input.slotDuration,
        reservationDuration: input.reservationDuration,
      });
    },
  });
