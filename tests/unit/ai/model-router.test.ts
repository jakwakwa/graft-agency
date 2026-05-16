import { describe, expect, it } from "vitest";
import { selectModel } from "@/lib/ai/model-router";

describe("selectModel", () => {
  it("returns Pro for general tool sets", () => {
    const model = selectModel(["captureLeadDetails", "checkAvailability"]);
    expect(model.modelId).toBe("gemini-3.1-pro-preview");
  });

  it("returns Flash when only searchKnowledgeBase is in scope", () => {
    const model = selectModel(["searchKnowledgeBase"]);
    expect(model.modelId).toBe("gemini-3-flash-preview");
  });

  it("returns Pro when there is exactly one tool but it is not searchKnowledgeBase", () => {
    const model = selectModel(["captureLeadDetails"]);
    expect(model.modelId).toBe("gemini-3.1-pro-preview");
  });

  it("returns Pro for empty tool set", () => {
    const model = selectModel([]);
    expect(model.modelId).toBe("gemini-3.1-pro-preview");
  });

  it("returns Pro for mixed tool sets including searchKnowledgeBase", () => {
    const model = selectModel(["searchKnowledgeBase", "captureLeadDetails"]);
    expect(model.modelId).toBe("gemini-3.1-pro-preview");
  });
});
