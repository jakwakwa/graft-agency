import { tool } from "ai";
import { z } from "zod";
import { agentService } from "@/lib/services/agent.service";
import { calService } from "@/lib/services/cal.service";

export const createCheckAvailabilityTool = (clientId: string) =>
  tool({
    description:
      "Queries available appointment time slots from the calendar. Calendar config is set per client—call with no args or optional dateRange. Do not search the knowledge base for calendar config.",
    inputSchema: z.object({
      username: z.string().optional(),
      eventTypeSlug: z.string().optional(),
      eventTypeId: z.number().optional().describe("The ID of the event type"),
      dateRange: z
        .object({
          from: z.string().describe("Start of search range (ISO string)"),
          to: z.string().describe("End of search range (ISO string)"),
        })
        .optional(),
      start: z.string().optional().describe("Start time (ISO string)"),
      end: z.string().optional().describe("End time (ISO string)"),
      timeZone: z.string().optional().default("Africa/Johannesburg"),
    }),
    execute: async (input) => {
      const config = await agentService.getConfig(clientId);
      const username = input.username ?? config.calComUsername ?? null;
      const eventTypeSlug = input.eventTypeSlug ?? config.defaultEventSlug ?? null;
      const eventTypeId = input.eventTypeId;

      if (!eventTypeId && (!username || !eventTypeSlug)) {
        return {
          slots: [],
          error:
            "Calendar not configured. The client must set calComUsername and defaultEventSlug in AgentConfig, or you must provide username and eventTypeSlug, or an eventTypeId.",
        };
      }

      return calService.getAvailability({
        username: username ?? undefined,
        eventTypeSlug: eventTypeSlug ?? undefined,
        eventTypeId,
        dateRange: input.dateRange,
        start: input.start,
        end: input.end,
        timeZone: input.timeZone,
      });
    },
  });
