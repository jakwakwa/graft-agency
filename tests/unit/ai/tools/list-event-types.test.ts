import { describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import { createListEventTypesTool } from "@/lib/ai/tools/list-event-types";

vi.mock("@/lib/services/cal.service", () => ({
  calService: {
    getEventTypes: vi.fn().mockResolvedValue([
      { id: 1, title: "15 Min Meeting", slug: "15min" },
      { id: 2, title: "30 Min Meeting", slug: "30min" },
    ]),
  },
}));

const tool = createListEventTypesTool("test-client");
const schema = tool.inputSchema as z.ZodType;

function executeListEventTypesTool() {
  const execute = tool.execute;
  if (!execute) {
    throw new Error("List event types tool has no execute handler");
  }
  return execute;
}

describe("createListEventTypesTool", () => {
  it("has a description", () => {
    expect(tool.description).toBeDefined();
  });

  it("validates empty object", () => {
    const result = schema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("calls calService.getEventTypes and returns the result", async () => {
    const { calService } = await import("@/lib/services/cal.service");
    const execute = executeListEventTypesTool();
    const result = await execute(
      {},
      {
        toolCallId: "tc-1",
        messages: [],
        abortSignal: new AbortController().signal,
      },
    );

    expect(calService.getEventTypes).toHaveBeenCalled();
    expect(result).toEqual([
      { id: 1, title: "15 Min Meeting", slug: "15min" },
      { id: 2, title: "30 Min Meeting", slug: "30min" },
    ]);
  });

  it("handles errors from calService.getEventTypes", async () => {
    const { calService } = await import("@/lib/services/cal.service");
    vi.mocked(calService.getEventTypes).mockRejectedValueOnce(new Error("API Error"));

    const execute = executeListEventTypesTool();
    await expect(
      execute(
        {},
        {
          toolCallId: "tc-1",
          messages: [],
          abortSignal: new AbortController().signal,
        },
      ),
    ).rejects.toThrow("API Error");
  });
});
