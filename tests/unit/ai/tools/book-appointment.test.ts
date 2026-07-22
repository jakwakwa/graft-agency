import { describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import { createBookAppointmentTool } from "@/lib/ai/tools/book-appointment";

vi.mock("@/lib/services/agent.service", () => ({
  agentService: {
    getConfig: vi.fn().mockResolvedValue({
      calComUsername: "testuser",
      defaultEventSlug: "15min",
    }),
  },
}));

vi.mock("@/lib/services/cal", () => ({
  calService: {
    createBooking: vi.fn().mockResolvedValue({
      bookingUid: "booking-abc",
      confirmationUrl: "https://cal.com/booking/abc",
    }),
  },
}));

const tool = createBookAppointmentTool("test-client");
const schema = tool.inputSchema as z.ZodType;

function executeBookAppointmentTool() {
  const execute = tool.execute;
  if (!execute) {
    throw new Error("Book appointment tool has no execute handler");
  }
  return execute;
}

describe("createBookAppointmentTool", () => {
  const validInput = {
    start: "2026-03-20T10:00:00Z",
    name: "Alice Smith",
    email: "alice@example.com",
    timeZone: "Africa/Johannesburg",
  };

  it("has a description", () => {
    expect(tool.description).toBeDefined();
  });

  it("validates required fields: start, name, email", () => {
    const result = schema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("validates username and eventTypeSlug as optional", () => {
    const result = schema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("calls calService.createBooking with config defaults", async () => {
    const { calService } = await import("@/lib/services/cal");
    const execute = executeBookAppointmentTool();
    await execute(validInput, {
      toolCallId: "tc-1",
      messages: [],
      abortSignal: new AbortController().signal,
    });
    expect(calService.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "testuser",
        eventTypeSlug: "15min",
        start: validInput.start,
        name: validInput.name,
        email: validInput.email,
      }),
    );
  });

  it("returns bookingUid and confirmationUrl", async () => {
    const execute = executeBookAppointmentTool();
    const result = await execute(validInput, {
      toolCallId: "tc-1",
      messages: [],
      abortSignal: new AbortController().signal,
    });
    expect(result).toEqual(
      expect.objectContaining({
        bookingUid: "booking-abc",
        confirmationUrl: "https://cal.com/booking/abc",
      }),
    );
  });

  it("returns error when config has no calComUsername or defaultEventSlug", async () => {
    const { agentService } = await import("@/lib/services/agent.service");
    vi.mocked(agentService.getConfig).mockResolvedValueOnce({
      calComUsername: null,
      defaultEventSlug: null,
    } as never);

    const execute = executeBookAppointmentTool();
    const result = await execute(validInput, {
      toolCallId: "tc-1",
      messages: [],
      abortSignal: new AbortController().signal,
    });
    expect(result).toHaveProperty("error");
  });
});
