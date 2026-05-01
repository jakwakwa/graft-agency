import { describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import { createCheckAvailabilityTool } from "@/lib/ai/tools/check-availability";

vi.mock("@/lib/services/agent.service", () => ({
  agentService: {
    getConfig: vi.fn().mockResolvedValue({
      calComUsername: "testuser",
      defaultEventSlug: "15min",
    }),
  },
}));

vi.mock("@/lib/services/cal.service", () => ({
  calService: {
    getAvailability: vi.fn().mockResolvedValue({
      slots: [
        { date: "2026-03-20", time: "10:00", duration: 30 },
        { date: "2026-03-20", time: "14:00", duration: 30 },
      ],
    }),
  },
}));

const tool = createCheckAvailabilityTool("test-client");
const schema = tool.inputSchema as z.ZodType;
const dateRangeInput = {
  dateRange: { from: "2026-03-18", to: "2026-03-22" },
  timeZone: "Africa/Johannesburg",
};

function executeCheckAvailabilityTool() {
  const execute = tool.execute;
  if (!execute) {
    throw new Error("Check availability tool has no execute handler");
  }
  return execute;
}

describe("createCheckAvailabilityTool", () => {
  it("has a description", () => {
    expect(tool.description).toBeDefined();
  });

  it("validates dateRange schema", () => {
    const result = schema.safeParse({
      dateRange: { from: "2026-03-18", to: "2026-03-22" },
    });
    expect(result.success).toBe(true);
  });

  it("validates username and eventTypeSlug as optional", () => {
    const result = schema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("calls calService.getAvailability with config defaults", async () => {
    const { calService } = await import("@/lib/services/cal.service");
    const execute = executeCheckAvailabilityTool();
    await execute(dateRangeInput, { toolCallId: "tc-1", messages: [], abortSignal: new AbortController().signal });
    expect(calService.getAvailability).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "testuser",
        eventTypeSlug: "15min",
        dateRange: { from: "2026-03-18", to: "2026-03-22" },
      }),
    );
  });

  it("returns slots array", async () => {
    const execute = executeCheckAvailabilityTool();
    const result = await execute(dateRangeInput, {
      toolCallId: "tc-1",
      messages: [],
      abortSignal: new AbortController().signal,
    });
    expect(result).toEqual(expect.objectContaining({ slots: expect.any(Array) }));
  });

  it("returns error when config has no calComUsername or defaultEventSlug", async () => {
    const { agentService } = await import("@/lib/services/agent.service");
    vi.mocked(agentService.getConfig).mockResolvedValueOnce({
      calComUsername: null,
      defaultEventSlug: null,
    } as never);

    const execute = executeCheckAvailabilityTool();
    const result = await execute(
      { timeZone: "Africa/Johannesburg" },
      { toolCallId: "tc-1", messages: [], abortSignal: new AbortController().signal },
    );
    expect(result).toHaveProperty("slots", []);
    expect(result).toHaveProperty("error");
  });
});
