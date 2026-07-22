import { describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import { createReserveSlotTool } from "@/lib/ai/tools/reserve-slot";

vi.mock("@/lib/services/cal", () => ({
  calService: {
    reserveSlot: vi.fn().mockResolvedValue({
      uid: "mock-reservation-uid",
    }),
  },
}));

const tool = createReserveSlotTool("test-client");
const schema = tool.inputSchema as z.ZodType;

function executeReserveSlotTool() {
  const execute = tool.execute;
  if (!execute) {
    throw new Error("Reserve slot tool has no execute handler");
  }
  return execute;
}

describe("createReserveSlotTool", () => {
  const validInput = {
    eventTypeId: 123,
    slotStart: "2026-03-20T10:00:00Z",
  };

  const validInputWithOptionals = {
    eventTypeId: 123,
    slotStart: "2026-03-20T10:00:00Z",
    slotDuration: 30,
    reservationDuration: 10,
  };

  it("has a description", () => {
    expect(tool.description).toBeDefined();
    expect(tool.description).toContain("Temporarily reserves a slot");
  });

  it("validates required fields: eventTypeId, slotStart", () => {
    const result = schema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("validates optional fields: slotDuration, reservationDuration", () => {
    const result = schema.safeParse(validInputWithOptionals);
    expect(result.success).toBe(true);
  });

  it("fails validation if eventTypeId is missing", () => {
    const result = schema.safeParse({ slotStart: "2026-03-20T10:00:00Z" });
    expect(result.success).toBe(false);
  });

  it("fails validation if slotStart is missing", () => {
    const result = schema.safeParse({ eventTypeId: 123 });
    expect(result.success).toBe(false);
  });

  it("calls calService.reserveSlot with input parameters", async () => {
    const { calService } = await import("@/lib/services/cal");
    const execute = executeReserveSlotTool();
    await execute(validInputWithOptionals, {
      toolCallId: "tc-1",
      messages: [],
      abortSignal: new AbortController().signal,
    });

    expect(calService.reserveSlot).toHaveBeenCalledWith({
      eventTypeId: validInputWithOptionals.eventTypeId,
      slotStart: validInputWithOptionals.slotStart,
      slotDuration: validInputWithOptionals.slotDuration,
      reservationDuration: validInputWithOptionals.reservationDuration,
    });
  });

  it("returns the result from calService.reserveSlot", async () => {
    const execute = executeReserveSlotTool();
    const result = await execute(validInput, {
      toolCallId: "tc-1",
      messages: [],
      abortSignal: new AbortController().signal,
    });

    expect(result).toEqual({
      uid: "mock-reservation-uid",
    });
  });

  it("propagates errors from calService.reserveSlot", async () => {
    const { calService } = await import("@/lib/services/cal");
    vi.mocked(calService.reserveSlot).mockRejectedValueOnce(new Error("API Error"));

    const execute = executeReserveSlotTool();
    await expect(
      execute(validInput, {
        toolCallId: "tc-1",
        messages: [],
        abortSignal: new AbortController().signal,
      }),
    ).rejects.toThrow("API Error");
  });
});
