import { describe, expect, it } from "vitest";
import { createTools } from "@/lib/ai/tools";

describe("createTools", () => {
  it("does not expose event type discovery to the chatbot", () => {
    const tools = createTools("client-1", { bookingEnabled: true });

    expect(tools).not.toHaveProperty("listEventTypes");
    expect(tools).toHaveProperty("checkAvailability");
    expect(tools).toHaveProperty("bookAppointment");
  });

  it("includes booking tools only when the booking add-on is enabled", () => {
    const tools = createTools("client-1", { bookingEnabled: true });

    expect(tools).toHaveProperty("checkAvailability");
    expect(tools).toHaveProperty("bookAppointment");
    expect(tools).toHaveProperty("reserveSlot");
  });

  it("strips every scheduling tool when the booking add-on is disabled", () => {
    const tools = createTools("client-1", { bookingEnabled: false });

    expect(tools).not.toHaveProperty("checkAvailability");
    expect(tools).not.toHaveProperty("bookAppointment");
    expect(tools).not.toHaveProperty("reserveSlot");
    // Knowledge-only fallback keeps lead capture and human handoff so the
    // owner still receives enquiries by email.
    expect(tools).toHaveProperty("captureLeadDetails");
    expect(tools).toHaveProperty("searchKnowledgeBase");
    expect(tools).toHaveProperty("handoffToHuman");
  });
});
