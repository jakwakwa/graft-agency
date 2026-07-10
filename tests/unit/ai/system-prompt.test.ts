import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";

const baseConfig = {
  id: "config-1",
  clientId: "client-1",
  systemPrompt: "You are a helpful assistant.",
  knowledgeBase: null as unknown,
  agentName: "GRAFT Bot",
  greetingMessage: "Hello! How can I help you today?",
  widgetPrimaryColour: "#000000",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("buildSystemPrompt", () => {
  it("includes the agent name from config", () => {
    const prompt = buildSystemPrompt(baseConfig, { bookingEnabled: true });
    expect(prompt).toContain("GRAFT Bot");
  });

  it("includes the greeting message", () => {
    const prompt = buildSystemPrompt(baseConfig, { bookingEnabled: true });
    expect(prompt).toContain("Hello! How can I help you today?");
  });

  it("includes knowledge base context when present", () => {
    const config = {
      ...baseConfig,
      knowledgeBase: [{ question: "What are your hours?", answer: "9am to 5pm" }],
    };
    const prompt = buildSystemPrompt(config, { bookingEnabled: true });
    expect(prompt).toContain("What are your hours?");
    expect(prompt).toContain("9am to 5pm");
  });

  it("omits knowledge base section when null", () => {
    const prompt = buildSystemPrompt({ ...baseConfig, knowledgeBase: null }, { bookingEnabled: true });
    expect(prompt).not.toContain("Knowledge Base");
  });

  it("uses UK English instructions", () => {
    const prompt = buildSystemPrompt(baseConfig, { bookingEnabled: true });
    expect(prompt).toMatch(/colour|organisation|behaviour/i);
  });

  it("includes South African scheduling rule when booking is enabled", () => {
    const prompt = buildSystemPrompt(baseConfig, { bookingEnabled: true });
    expect(prompt).toContain("Africa/Johannesburg");
    expect(prompt).toContain("load shedding");
  });

  it("omits all scheduling instructions when booking is disabled", () => {
    const prompt = buildSystemPrompt(
      { ...baseConfig, calComUsername: "someone", defaultEventSlug: "15min" },
      { bookingEnabled: false },
    );
    expect(prompt).not.toContain("Africa/Johannesburg");
    expect(prompt).not.toContain("checkAvailability");
  });

  it("directs the bot to capture contact details instead of booking when disabled", () => {
    const prompt = buildSystemPrompt(baseConfig, { bookingEnabled: false });
    expect(prompt).toContain("cannot book meetings");
    expect(prompt).toContain("captureLeadDetails");
    expect(prompt).toContain("staff member will get back to them");
  });

  it("instructs direct checkAvailability use when booking is enabled and Cal.com is configured", () => {
    const prompt = buildSystemPrompt(
      { ...baseConfig, calComUsername: "someone", defaultEventSlug: "15min" },
      { bookingEnabled: true },
    );
    expect(prompt).toContain("use checkAvailability directly");
  });
});
