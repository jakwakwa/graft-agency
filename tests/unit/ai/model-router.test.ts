import { describe, expect, it } from "vitest";
import { selectModel } from "@/lib/ai/model-router";

describe("selectModel", () => {
  it("returns Flash for general tool sets", () => {
    const model = selectModel(["captureLeadDetails", "checkAvailability"]);
    expect(model.modelId).toBe("gemini-3-flash-preview");
  });

  it("returns Flash Lite when only searchKnowledgeBase is in scope", () => {
    const model = selectModel(["searchKnowledgeBase"]);
    expect(model.modelId).toBe("gemini-3.1-flash-lite-preview");
  });

  it("returns Flash for empty tool set", () => {
    const model = selectModel([]);
    expect(model.modelId).toBe("gemini-3-flash-preview");
  });

  it("returns Flash for mixed tool sets including searchKnowledgeBase", () => {
    const model = selectModel(["searchKnowledgeBase", "captureLeadDetails"]);
    expect(model.modelId).toBe("gemini-3-flash-preview");
  });
});
