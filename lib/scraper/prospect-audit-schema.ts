import { z } from "zod";

export const prospectAuditSchema = z.object({
  hasChatbot: z.boolean().describe("Whether the website has a visible chatbot widget"),
  hasVoiceAgent: z.boolean().describe("Whether the website has any voice/phone AI agent"),
  businessDescription: z
    .string()
    .describe("1-2 sentence summary of what the business does"),
  coreServices: z
    .array(
      z.object({
        name: z.string().describe("Name of the service"),
        description: z.string().describe("Brief description of the service"),
      })
    )
    .describe("The main services or products the business offers"),
  painPoints: z
    .array(z.string())
    .describe("Implied problems that an AI chatbot/voice agent could solve for this business"),
  targetOutreachAngle: z
    .string()
    .describe("The single best angle for cold outreach to this business about AI automation"),
});

export type ProspectAudit = z.infer<typeof prospectAuditSchema>;
