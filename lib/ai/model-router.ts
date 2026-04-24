import { google } from "@ai-sdk/google";

export function selectModel(toolsInScope: string[]) {
  const isBasicRetrieval = toolsInScope.length === 1 && toolsInScope[0] === "searchKnowledgeBase";

  return isBasicRetrieval ? google("gemini-3.1-flash-preview") : google("gemini-3-flash-preview-lite");
}
