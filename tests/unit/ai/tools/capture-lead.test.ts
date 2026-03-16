import { describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import { captureLeadDetailsTool } from "@/lib/ai/tools/capture-lead";

vi.mock("@/lib/services/lead.service", () => ({
  leadService: {
    createFromChat: vi.fn().mockResolvedValue({ id: "lead-123" }),
  },
}));

const schema = captureLeadDetailsTool.inputSchema as z.ZodType;

describe("captureLeadDetails tool", () => {
  it("has a description", () => {
    expect(captureLeadDetailsTool.description).toBeDefined();
  });

  it("validates input schema: accepts name + email", () => {
    const result = schema.safeParse({
      name: "Alice",
      email: "alice@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("validates input schema: accepts name + phone", () => {
    const result = schema.safeParse({
      name: "Bob",
      phone: "+44123456789",
    });
    expect(result.success).toBe(true);
  });

  it("rejects input missing name", () => {
    const result = schema.safeParse({
      email: "noname@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("calls leadService.createFromChat with correct params", async () => {
    const { leadService } = await import("@/lib/services/lead.service");
    await captureLeadDetailsTool.execute(
      { name: "Alice", email: "alice@example.com" },
      { toolCallId: "tc-1", messages: [], abortSignal: new AbortController().signal },
    );
    expect(leadService.createFromChat).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Alice", email: "alice@example.com" }),
    );
  });

  it("returns leadId and confirmation message", async () => {
    const result = await captureLeadDetailsTool.execute(
      { name: "Alice", email: "alice@example.com" },
      { toolCallId: "tc-1", messages: [], abortSignal: new AbortController().signal },
    );
    expect(result).toEqual(expect.objectContaining({ leadId: "lead-123", message: "Details saved" }));
  });
});
