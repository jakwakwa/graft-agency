import { describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import { createSearchKnowledgeBaseTool } from "@/lib/ai/tools/search-knowledge";

vi.mock("@/lib/services/agent.service", () => ({
  agentService: {
    searchKnowledge: vi.fn().mockResolvedValue({
      answer: "We are open 9am to 5pm Monday to Friday.",
      sources: ["FAQ"],
    }),
  },
}));

const searchKnowledgeBaseTool = createSearchKnowledgeBaseTool("client-1");
const schema = searchKnowledgeBaseTool.inputSchema as z.ZodType;

function executeSearchKnowledgeBaseTool() {
  const execute = searchKnowledgeBaseTool.execute;
  if (!execute) {
    throw new Error("Search knowledge base tool has no execute handler");
  }
  return execute;
}

describe("searchKnowledgeBase tool", () => {
  it("has a description", () => {
    expect(searchKnowledgeBaseTool.description).toBeDefined();
  });

  it("validates query string input", () => {
    const result = schema.safeParse({
      query: "What are your opening hours?",
    });
    expect(result.success).toBe(true);
  });

  it("rejects blank query input", () => {
    const result = schema.safeParse({
      query: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("calls agentService.searchKnowledge", async () => {
    const { agentService } = await import("@/lib/services/agent.service");
    const execute = executeSearchKnowledgeBaseTool();
    await execute(
      { query: "opening hours" },
      { toolCallId: "tc-1", messages: [], abortSignal: new AbortController().signal },
    );
    expect(agentService.searchKnowledge).toHaveBeenCalledWith({
      clientId: "client-1",
      query: "opening hours",
    });
  });

  it("returns answer and optional sources", async () => {
    const execute = executeSearchKnowledgeBaseTool();
    const result = await execute(
      { query: "opening hours" },
      { toolCallId: "tc-1", messages: [], abortSignal: new AbortController().signal },
    );
    expect(result).toHaveProperty("answer");
    expect(result).toHaveProperty("sources");
  });
});
