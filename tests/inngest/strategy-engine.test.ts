import { describe, expect, it, vi } from "vitest";
import { generateCampaignStrategy } from "@/lib/inngest/functions/strategy-engine";
import type { ProfiledNeeds } from "@/lib/types/engagement";

vi.mock("@/lib/db/prisma", () => ({
  default: {
    productSpec: { update: vi.fn().mockResolvedValue({ id: "spec-1" }) },
    lead: { findUnique: vi.fn() },
  },
}));

const sopJson = JSON.stringify({
  refinedEmail: { subject: "A faster way to book Acme jobs", body: "Hi Jane,\nNoticed you take bookings by phone…" },
  strategyNarrative: "Target the owner; lead with the lost-bookings pain point.",
  objectives: ["Book a discovery call", "Demonstrate the booking flow"],
  visualFramework: "Hero with live booking widget, proof band, single CTA.",
  designTone: ["premium", "trustworthy"],
  businessArchetype: "traditional",
  outreachBestPractices: ["Keep it under 120 words", "One clear CTA"],
});

vi.mock("@google/genai", () => ({
  ThinkingLevel: { HIGH: "HIGH" },
  Type: { OBJECT: "OBJECT", STRING: "STRING", ARRAY: "ARRAY", BOOLEAN: "BOOLEAN" },
  GoogleGenAI: vi.fn().mockImplementation(function GoogleGenAI() {
    return {
      models: {
        generateContent: vi.fn().mockResolvedValue({ text: sopJson }),
      },
    };
  }),
}));

describe("generateCampaignStrategy", () => {
  const profiledNeeds: ProfiledNeeds = {
    leadId: "lead-123",
    companyName: "Acme Plumbing",
    websiteUrl: "https://acmeplumbing.com",
    industry: "Trade Services",
    painPoints: ["Manual job scheduling"],
    primaryNeed: "Automated booking portal",
    productType: "web-app",
    targetAudience: "Homeowners",
    estimatedComplexity: "medium",
  };

  it("returns a parsed Campaign SOP with refined email and design tone", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key";

    const sop = await generateCampaignStrategy({
      profiledNeeds,
      prdContent: "## PRD\nBuild a booking portal.",
      engagementObjectives: "Book 5 discovery calls this month",
      draftSubject: "Hello from GRAFT",
      draftBody: "We can help.",
    });

    expect(sop.refinedEmail.subject).toContain("Acme");
    expect(sop.refinedEmail.body).toContain("Hi Jane");
    expect(sop.objectives.length).toBeGreaterThan(0);
    expect(sop.designTone).toContain("premium");
    expect(sop.visualFramework).toContain("CTA");
    expect(sop.businessArchetype).toBe("traditional");
  });

  it("throws when the Gemini API key is missing", async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    await expect(
      generateCampaignStrategy({
        profiledNeeds,
        prdContent: "x",
        engagementObjectives: null,
        draftSubject: null,
        draftBody: null,
      }),
    ).rejects.toThrow("GEMINI_API_KEY");
  });
});
