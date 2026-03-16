import { tool } from "ai";
import { z } from "zod";
import { agentService } from "@/lib/services/agent.service";

export const createSearchKnowledgeBaseTool = (clientId: string) =>
  tool({
    description: "Searches the client knowledge base for answers to visitor questions.",
    inputSchema: z.object({
      query: z.string().trim().min(1),
    }),
    execute: async (input) => {
      return await agentService.searchKnowledge({ clientId, ...input });
    },
  });
