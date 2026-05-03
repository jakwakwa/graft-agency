import { tool } from "ai";
import { z } from "zod";
import { calService } from "@/lib/services/cal.service";

export const createListEventTypesTool = (clientId: string) =>
  tool({
    description: "Lists all available event types from the calendar. Use this to find the eventTypeId required for reserving slots or booking appointments.",
    inputSchema: z.object({}),
    execute: async () => {
      return await calService.getEventTypes();
    },
  });
