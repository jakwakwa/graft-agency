import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";

const baseConfig = {
  id: "config-1",
  clientId: "client-1",
  systemPrompt: "You are a helpful assistant.",
  knowledgeBase: null as unknown,
  agentName: "Kona Bot",
  greetingMessage: "Hello! How can I help you today?",
  widgetPrimaryColour: "#000000",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("buildSystemPrompt", () => {
  it("includes the agent name from config", () => {
    const prompt = buildSystemPrompt(baseConfig);
    expect(prompt).toContain("Kona Bot");
  });

  it("includes the greeting message", () => {
    const prompt = buildSystemPrompt(baseConfig);
    expect(prompt).toContain("Hello! How can I help you today?");
  });

  it("includes knowledge base context when present", () => {
    const config = {
      ...baseConfig,
      knowledgeBase: [{ question: "What are your hours?", answer: "9am to 5pm" }],
    };
    const prompt = buildSystemPrompt(config);
    expect(prompt).toContain("What are your hours?");
    expect(prompt).toContain("9am to 5pm");
  });

  it("omits knowledge base section when null", () => {
    const prompt = buildSystemPrompt({ ...baseConfig, knowledgeBase: null });
    expect(prompt).not.toContain("Knowledge Base");
  });

  it("uses UK English instructions", () => {
    const prompt = buildSystemPrompt(baseConfig);
    expect(prompt).toMatch(/colour|organisation|behaviour/i);
  });

  it("includes South African scheduling rule (Africa/Johannesburg, load shedding)", () => {
    const prompt = buildSystemPrompt(baseConfig);
    expect(prompt).toContain("Africa/Johannesburg");
    expect(prompt).toContain("load shedding");
  });
});
