import { tool } from "ai";
import { z } from "zod";
import { leadService } from "@/lib/services/lead.service";

export const captureLeadDetailsTool = tool({
  description: "Captures visitor lead details when name and at least email or phone are provided.",
  inputSchema: z.object({
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    need: z.string().optional(),
  }),
  execute: async (input) => {
    const lead = await leadService.createFromChat(input);
    return { leadId: lead.id, message: "Details saved" };
  },
});
