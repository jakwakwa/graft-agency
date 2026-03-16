import { appendFileSync } from "fs";
import { join } from "path";
import { tool } from "ai";
import { z } from "zod";
import { agentService } from "@/lib/services/agent.service";
import { calService } from "@/lib/services/cal.service";

const DEBUG_LOG = join(process.cwd(), ".cursor", "debug-0b2dc2.log");
const dbg = (loc: string, msg: string, data: object, h: string) => {
  try {
    appendFileSync(DEBUG_LOG, JSON.stringify({ location: loc, message: msg, data, hypothesisId: h, timestamp: Date.now() }) + "\n");
  } catch {}
};

export const createCheckAvailabilityTool = (clientId: string) =>
  tool({
    description:
      "Queries available appointment time slots from the calendar. Calendar config is set per client—call with no args or optional dateRange. Do not search the knowledge base for calendar config.",
    inputSchema: z.object({
      username: z.string().optional(),
      eventTypeSlug: z.string().optional(),
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

      // #region agent log
      dbg("check-availability:config", "checkAvailability config", { clientId, calComUsername: config.calComUsername, defaultEventSlug: config.defaultEventSlug, username, eventTypeSlug, hasBoth: !!(username && eventTypeSlug) }, "H1");
      // #endregion

      if (!username || !eventTypeSlug) {
        const err = {
          slots: [],
          error:
            "Calendar not configured. The client must set calComUsername and defaultEventSlug in AgentConfig, or you must provide username and eventTypeSlug.",
        };
        // #region agent log
        dbg("check-availability:noConfig", "early return", { reason: "missing username or eventTypeSlug" }, "H1");
        // #endregion
        return err;
      }

      const result = await calService.getAvailability({
        username,
        eventTypeSlug,
        dateRange: input.dateRange,
        start: input.start,
        end: input.end,
        timeZone: input.timeZone,
      });

      // #region agent log
      dbg("check-availability:result", "checkAvailability result", { slotCount: result.slots?.length ?? 0, hasError: !!result.error, errorPreview: result.error?.slice(0, 120) }, "H3");
      // #endregion

      return result;
    },
  });
