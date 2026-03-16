import { describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import { bookAppointmentTool } from "@/lib/ai/tools/book-appointment";

vi.mock("@/lib/services/cal.service", () => ({
  calService: {
    createBooking: vi.fn().mockResolvedValue({
      bookingUid: "booking-abc",
      confirmationUrl: "https://cal.com/booking/abc",
    }),
  },
}));

const schema = bookAppointmentTool.inputSchema as z.ZodType;

describe("bookAppointment tool", () => {
  const validInput = {
    leadId: "lead-123",
    slotStart: "2026-03-20T10:00:00Z",
    slotEnd: "2026-03-20T10:30:00Z",
    name: "Alice Smith",
    email: "alice@example.com",
  };

  it("has a description", () => {
    expect(bookAppointmentTool.description).toBeDefined();
  });

  it("validates required fields: leadId, slotStart, slotEnd, name, email", () => {
    const result = schema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("calls calService.createBooking with correct params", async () => {
    const { calService } = await import("@/lib/services/cal.service");
    await bookAppointmentTool.execute(validInput, {
      toolCallId: "tc-1",
      messages: [],
      abortSignal: new AbortController().signal,
    });
    expect(calService.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        slotStart: validInput.slotStart,
        slotEnd: validInput.slotEnd,
        name: validInput.name,
        email: validInput.email,
      }),
    );
  });

  it("returns bookingUid and confirmationUrl", async () => {
    const result = await bookAppointmentTool.execute(validInput, {
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
});
