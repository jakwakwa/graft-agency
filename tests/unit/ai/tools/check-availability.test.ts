import { describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import { checkAvailabilityTool } from "@/lib/ai/tools/check-availability";

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

const schema = checkAvailabilityTool.inputSchema as z.ZodType;

describe("checkAvailability tool", () => {
  it("has a description", () => {
    expect(checkAvailabilityTool.description).toBeDefined();
  });

  it("validates dateRange schema", () => {
    const result = schema.safeParse({
      dateRange: { from: "2026-03-18", to: "2026-03-22" },
    });
    expect(result.success).toBe(true);
  });

  it("calls calService.getAvailability", async () => {
    const { calService } = await import("@/lib/services/cal.service");
    await checkAvailabilityTool.execute(
      { dateRange: { from: "2026-03-18", to: "2026-03-22" } },
      { toolCallId: "tc-1", messages: [], abortSignal: new AbortController().signal },
    );
    expect(calService.getAvailability).toHaveBeenCalled();
  });

  it("returns slots array", async () => {
    const result = await checkAvailabilityTool.execute(
      {},
      { toolCallId: "tc-1", messages: [], abortSignal: new AbortController().signal },
    );
    expect(result).toHaveProperty("slots");
    expect(Array.isArray(result.slots)).toBe(true);
  });
});
