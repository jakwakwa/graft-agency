import { describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import { handoffToHumanTool } from "@/lib/ai/tools/handoff-human";

vi.mock("@/lib/services/lead.service", () => ({
  leadService: {
    flagForHandoff: vi.fn().mockResolvedValue({ status: "flagged" }),
  },
}));

const schema = handoffToHumanTool.inputSchema as z.ZodType;

describe("handoffToHuman tool", () => {
  it("has a description", () => {
    expect(handoffToHumanTool.description).toBeDefined();
  });

  it("validates urgency enum: low, medium, high", () => {
    for (const urgency of ["low", "medium", "high"] as const) {
      const result = schema.safeParse({
        reason: "Customer wants to speak to a human",
        urgency,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid urgency value", () => {
    const result = schema.safeParse({
      reason: "test",
      urgency: "critical",
    });
    expect(result.success).toBe(false);
  });

  it("calls leadService.flagForHandoff", async () => {
    const { leadService } = await import("@/lib/services/lead.service");
    await handoffToHumanTool.execute(
      { reason: "Customer is upset", urgency: "high" as const },
      { toolCallId: "tc-1", messages: [], abortSignal: new AbortController().signal },
    );
    expect(leadService.flagForHandoff).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "Customer is upset", urgency: "high" }),
    );
  });

  it("returns handoff status", async () => {
    const result = await handoffToHumanTool.execute(
      { reason: "Complex query", urgency: "medium" as const },
      { toolCallId: "tc-1", messages: [], abortSignal: new AbortController().signal },
    );
    expect(result).toEqual(expect.objectContaining({ status: "flagged" }));
  });
});
