import { describe, it, expect } from "vitest";
import type { ProfiledNeeds, DesignConcept, LeadPipelineEvent } from "@/lib/types/engagement";

describe("engagement types", () => {
  it("ProfiledNeeds has required fields", () => {
    const needs: ProfiledNeeds = {
      leadId: "lead-123",
      companyName: "Acme Corp",
      websiteUrl: "https://acme.com",
      industry: "Retail",
      painPoints: ["No online booking", "Manual quoting"],
      primaryNeed: "Automated booking and quoting system",
      productType: "web-app",
      targetAudience: "Small retail owners",
      estimatedComplexity: "medium",
    };
    expect(needs.primaryNeed).toBeTruthy();
    expect(needs.painPoints.length).toBeGreaterThan(0);
  });

  it("DesignConcept has required fields", () => {
    const concept: DesignConcept = {
      index: 0,
      name: "Minimal Dashboard",
      description: "Clean booking interface with dark mode",
      colorScheme: { primary: "#6366f1", background: "#0f172a", text: "#f8fafc" },
      components: ["BookingCalendar", "QuoteForm", "Dashboard"],
      styleKeywords: ["minimal", "professional", "dark"],
      screenId: "abc123",
      projectId: "proj456",
    };
    expect(concept.index).toBe(0);
  });

  it("LeadPipelineEvent has pipeline fields", () => {
    const event: LeadPipelineEvent = {
      leadId: "lead-123",
      clientId: "client-456",
      stage: "PROFILING",
    };
    expect(event.leadId).toBeTruthy();
  });
});
