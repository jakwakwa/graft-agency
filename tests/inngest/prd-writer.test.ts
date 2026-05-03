import { describe, it, expect, vi } from "vitest";
import { writePRD } from "@/lib/inngest/functions/prd-writer";

vi.mock("@/lib/db/prisma", () => ({
  default: {
    productSpec: {
      update: vi.fn().mockResolvedValue({ id: "spec-1" }),
    },
  },
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(function GoogleGenAI() {
    return {
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: `# PRD: Acme Plumbing Booking Portal

## Problem Statement
Acme Plumbing loses 40% of potential bookings due to phone-only scheduling.

## Goals
- Enable online booking 24/7
- Automate quoting for common jobs

## Features
### MVP
- [ ] Online booking form with date/time picker
- [ ] Automated quote calculator (job type × hourly rate)
- [ ] Email confirmation to customer and plumber
- [ ] Admin dashboard showing upcoming jobs

## Tech Stack
- Next.js 15 (App Router)
- Tailwind CSS + shadcn/ui
- Resend for email
- Vercel deployment

## User Stories
1. As a homeowner, I can book a plumber online without calling
2. As Acme admin, I can see all bookings in a dashboard

## Success Metrics
- 20+ online bookings in first month
- <2min average booking completion time`,
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
    expect(prd.length).toBeGreaterThan(100);
  });
});
