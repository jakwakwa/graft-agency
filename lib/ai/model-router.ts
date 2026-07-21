import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export function selectModel(toolsInScope: string[]) {
  const isBasicRetrieval = toolsInScope.length === 1 && toolsInScope[0] === "searchKnowledgeBase";

  return isBasicRetrieval ? google("gemini-3-flash-preview") : google("gemini-3.1-pro-preview");
}

