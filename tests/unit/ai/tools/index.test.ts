import { describe, expect, it } from "vitest";
import { createTools } from "@/lib/ai/tools";

describe("createTools", () => {
  it("does not expose event type discovery to the chatbot", () => {
    const tools = createTools("client-1");

    expect(tools).not.toHaveProperty("listEventTypes");
    expect(tools).toHaveProperty("checkAvailability");
    expect(tools).toHaveProperty("bookAppointment");
  });
});
