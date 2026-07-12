import { describe, expect, it } from "vitest";
import { getEngagementLinks, getLeadPipelineStatus } from "@/lib/utils/lead-pipeline-status";

describe("getLeadPipelineStatus", () => {
  it("returns draft for a pending draft without a pipeline", () => {
    expect(getLeadPipelineStatus({ leadStatus: "DRAFT_PENDING", engagementStage: null })).toBe("draft");
    expect(getLeadPipelineStatus({ leadStatus: "SCRAPED", engagementStage: undefined })).toBe("draft");
  });

  it("returns approved once an engagement spec exists", () => {
    expect(getLeadPipelineStatus({ leadStatus: "CONTACTED", engagementStage: "PENDING" })).toBe("approved");
    expect(getLeadPipelineStatus({ leadStatus: "CONTACTED", engagementStage: "BUILDING" })).toBe("approved");
    expect(getLeadPipelineStatus({ leadStatus: "REPLIED", engagementStage: "OFFER_SENT" })).toBe("approved");
  });

  it("returns approved for contacted leads that predate the pipeline", () => {
    expect(getLeadPipelineStatus({ leadStatus: "CONTACTED", engagementStage: null })).toBe("approved");
    expect(getLeadPipelineStatus({ leadStatus: "BOOKED", engagementStage: null })).toBe("approved");
  });

  it("returns failed when the pipeline failed", () => {
    expect(getLeadPipelineStatus({ leadStatus: "CONTACTED", engagementStage: "FAILED" })).toBe("failed");
  });

  it("returns denied for closed leads, even over a failed pipeline", () => {
    expect(getLeadPipelineStatus({ leadStatus: "CLOSED", engagementStage: null })).toBe("denied");
    expect(getLeadPipelineStatus({ leadStatus: "CLOSED", engagementStage: "FAILED" })).toBe("denied");
  });
});

describe("getEngagementLinks", () => {
  const concepts = [
    { projectId: "proj-1", screenId: "screen-1", htmlUrl: "https://storage.example/one.html", name: "Concept A" },
    { projectId: "proj-2", screenId: "screen-2", htmlUrl: "https://storage.example/two.html", name: "Concept B" },
  ];

  it("marks the build link ready once a deployment URL exists", () => {
    const links = getEngagementLinks({
      stage: "DEPLOYED",
      failedStage: null,
      deploymentUrl: "https://demo.example.app",
      designConcepts: concepts,
      chosenDesign: 0,
    });
    expect(links.build).toEqual({ href: "https://demo.example.app", ready: true, failed: false });
    expect(links.fallback.ready).toBe(true);
  });

  it("resolves the fallback link from the chosen design concept via the stitch-html proxy", () => {
    const links = getEngagementLinks({
      stage: "DESIGN_COMPLETE",
      failedStage: null,
      deploymentUrl: null,
      designConcepts: concepts,
      chosenDesign: 1,
    });
    expect(links.fallback.href).toBe("/api/engagement/stitch-html?projectId=proj-2&screenId=screen-2");
    expect(links.fallback.ready).toBe(true);
    expect(links.build).toEqual({ href: null, ready: false, failed: false });
  });

  it("falls back to the first concept when no design was chosen", () => {
    const links = getEngagementLinks({
      stage: "DESIGN_COMPLETE",
      failedStage: null,
      deploymentUrl: null,
      designConcepts: concepts,
      chosenDesign: null,
    });
    expect(links.fallback.href).toBe("/api/engagement/stitch-html?projectId=proj-1&screenId=screen-1");
  });

  it("disables the build option when the build stage failed but keeps the design fallback", () => {
    const links = getEngagementLinks({
      stage: "FAILED",
      failedStage: "BUILDING",
      deploymentUrl: null,
      designConcepts: concepts,
      chosenDesign: 0,
    });
    expect(links.build.failed).toBe(true);
    expect(links.build.ready).toBe(false);
    expect(links.fallback.ready).toBe(true);
  });

  it("disables the fallback option when the design stage failed", () => {
    const links = getEngagementLinks({
      stage: "FAILED",
      failedStage: "DESIGNING",
      deploymentUrl: null,
      designConcepts: [],
      chosenDesign: null,
    });
    expect(links.fallback).toEqual({ href: null, ready: false, failed: true });
    expect(links.build.ready).toBe(false);
  });

  it("returns no links while nothing has been produced", () => {
    const links = getEngagementLinks({
      stage: "PROFILING",
      failedStage: null,
      deploymentUrl: null,
      designConcepts: null,
      chosenDesign: null,
    });
    expect(links.build.href).toBeNull();
    expect(links.fallback.href).toBeNull();
    expect(links.build.ready).toBe(false);
    expect(links.fallback.ready).toBe(false);
  });
});
