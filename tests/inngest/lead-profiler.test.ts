import { describe, it, expect, vi, beforeEach } from "vitest";
import { profileLead } from "@/lib/inngest/functions/lead-profiler";

// Mock prisma
vi.mock("@/lib/db/prisma", () => ({
  default: {
    productSpec: {
      upsert: vi.fn().mockResolvedValue({ id: "spec-1", stage: "PROFILING" }),
      update: vi.fn().mockResolvedValue({ id: "spec-1", stage: "PROFILED" }),
    },
    lead: {
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        id: "lead-123",
        clientId: "client-456",
        customerName: "Jane Smith",
        email: "jane@acme.com",
        scrapedData: {
          companyName: "Acme Plumbing",
          websiteUrl: "https://acmeplumbing.com",
          auditSummary: "No AI presence, uses manual booking",
          painPoints: ["Manual job scheduling", "No online quoting"],
          aiPresence: false,
        },
      }),
    },
  },
}));

// Mock Google GenAI
vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(function GoogleGenAI() {
    return {
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            companyName: "Acme Plumbing",
            websiteUrl: "https://acmeplumbing.com",
            industry: "Trade Services",
            painPoints: ["Manual job scheduling", "No online quoting"],
            primaryNeed: "Automated job booking and quoting portal",
            productType: "web-app",
            targetAudience: "Homeowners needing plumbing services",
            estimatedComplexity: "medium",
          }),
        }),
      },
    };
  }),
  ThinkingLevel: { HIGH: "HIGH" },
  Type: { OBJECT: "OBJECT", STRING: "STRING", ARRAY: "ARRAY" },
}));

describe("profileLead", () => {
  it("returns profiled needs for a lead", async () => {
    // We need to set the API key for the test to proceed
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key";

    const result = await profileLead("lead-123", "client-456");
    expect(result.primaryNeed).toContain("booking");
    expect(result.painPoints).toHaveLength(2);
    expect(result.productType).toBe("web-app");
  });
});
