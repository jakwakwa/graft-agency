import { describe, it, expect, vi } from "vitest";
import { writePRD } from "@/lib/inngest/functions/prd-writer";

// Capture the prompt sent to Gemini so we can assert the two build variants differ.
const h = vi.hoisted(() => ({ prompts: [] as string[] }));

vi.mock("@/lib/db/prisma", () => ({
  default: {
    productSpec: {
      update: vi.fn().mockResolvedValue({ id: "spec-1" }),
      findUnique: vi.fn().mockResolvedValue({ buildVariant: "campaign" }),
    },
  },
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(function GoogleGenAI() {
    return {
      models: {
        generateContent: vi.fn().mockImplementation((req: { contents: string }) => {
          h.prompts.push(req.contents);
          return Promise.resolve({
            text: `# PRD: Acme Plumbing\n\n## Features\n- [ ] Hero\n\n## Design Direction\n### Theme Mode\ndark`,
          });
        }),
      },
    };
  }),
}));

describe("writePRD", () => {
  const profiledNeeds = {
    leadId: "lead-123",
    companyName: "Acme Plumbing",
    websiteUrl: "https://acmeplumbing.com",
    industry: "Trade Services",
    painPoints: ["Manual job scheduling", "No online quoting"],
    primaryNeed: "Automated job booking and quoting portal",
    productType: "web-app" as const,
    targetAudience: "Homeowners needing plumbing services",
    estimatedComplexity: "medium" as const,
  };

  it("returns a non-empty PRD string", async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key";
    const prd = await writePRD(profiledNeeds);
    expect(prd).toContain("# PRD");
    expect(prd).toContain("Features");
    expect(prd.length).toBeGreaterThan(50);
  });

  it("campaign variant frames the PRD as an engagement campaign presentation, not a landing page", async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key";
    h.prompts.length = 0;
    await writePRD(profiledNeeds, "campaign");
    const prompt = h.prompts[0] ?? "";
    expect(prompt).toContain("ENGAGEMENT CAMPAIGN PRESENTATION");
    expect(prompt).toContain("NOT Acme Plumbing's own website");
    expect(prompt).not.toContain("polished LANDING PAGE / product prototype");
    // Still carries the Design Direction contract for the Stitch parser.
    expect(prompt).toContain("## Design Direction");
  });

  it("landing variant frames the PRD as a landing page / prototype", async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key";
    h.prompts.length = 0;
    await writePRD(profiledNeeds, "landing");
    const prompt = h.prompts[0] ?? "";
    expect(prompt).toContain("LANDING PAGE");
    expect(prompt).not.toContain("ENGAGEMENT CAMPAIGN PRESENTATION");
    expect(prompt).toContain("## Design Direction");
  });
});
