import { tool } from "ai";
import { z } from "zod";
import { leadService } from "@/lib/services/lead.service";

export const handoffToHumanTool = tool({
  description: "Flags the conversation for human review when the AI cannot help.",
  inputSchema: z.object({
    reason: z.string(),
    urgency: z.enum(["low", "medium", "high"]),
  }),
  execute: async (input) => {
    return await leadService.flagForHandoff(input);
  },
});
