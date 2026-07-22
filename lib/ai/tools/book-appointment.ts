import { tool } from "ai";
import { z } from "zod";
import { agentService } from "@/lib/services/agent.service";
import { calService } from "@/lib/services/cal";

export const createBookAppointmentTool = (clientId: string) =>
  tool({
    description: "Books an appointment slot after the visitor confirms. Use the chosen slot time in ISO format.",
    inputSchema: z.object({
      username: z.string().optional(),
      eventTypeSlug: z.string().optional(),
      eventTypeId: z.number().optional().describe("The ID of the event type"),
      start: z.string().describe("The chosen slot time in ISO format"),
      name: z.string().describe("Attendee name"),
      email: z.string().email().describe("Attendee email"),
      timeZone: z.string().optional().default("Africa/Johannesburg"),
      notes: z.string().optional(),
      leadId: z.string().optional().describe("Lead ID for linking the booking"),
    }),
    execute: async (input) => {
      const config = await agentService.getConfig(clientId);
      const username = input.username ?? config.calComUsername ?? null;
      const eventTypeSlug = input.eventTypeSlug ?? config.defaultEventSlug ?? null;
      const eventTypeId = input.eventTypeId;

      if (!eventTypeId && (!username || !eventTypeSlug)) {
        return {
          error:
            "Calendar not configured. The client must set calComUsername and defaultEventSlug in AgentConfig, or you must provide username and eventTypeSlug, or an eventTypeId.",
        };
      }

      return await calService.createBooking({
        username: username ?? undefined,
        eventTypeSlug: eventTypeSlug ?? undefined,
        eventTypeId,
        start: input.start,
        name: input.name,
        email: input.email,
        timeZone: input.timeZone,
        notes: input.notes,
        leadId: input.leadId,
      });
    },
  });
