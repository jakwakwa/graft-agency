import {
  conceptHtmlHref,
  conceptLink,
  conceptProjectId,
  conceptScreenId,
  parseDesignConcepts,
} from "./design-concepts";

/**
 * Operator-facing pipeline status for an outbound prospect lead, derived
 * from the Lead row plus its (optional) ProductSpec engagement stage.
 * Drives the leads-page status filter and per-card badge.
 */
export const LEAD_PIPELINE_STATUSES = ["approved", "denied", "failed", "draft"] as const;
export type LeadPipelineStatus = (typeof LEAD_PIPELINE_STATUSES)[number];

export const LEAD_PIPELINE_STATUS_LABELS: Record<LeadPipelineStatus, string> = {
  approved: "Pipeline Approved",
  denied: "Denied",
  failed: "Failed",
  draft: "Draft",
};

export function getLeadPipelineStatus(params: {
  leadStatus: string;
  engagementStage: string | null | undefined;
}): LeadPipelineStatus {
  const { leadStatus, engagementStage } = params;

  // An operator decision to close the lead outranks pipeline state.
  if (leadStatus === "CLOSED") return "denied";
  if (engagementStage === "FAILED") return "failed";
  // Any spec row means the engagement pipeline was approved/started.
  if (engagementStage) return "approved";
  if (leadStatus === "DRAFT_PENDING" || leadStatus === "SCRAPED") return "draft";
  // CONTACTED / REPLIED / BOOKED without a spec: outreach was approved pre-pipeline.
  return "approved";
}

export type EngagementLinkType = "build" | "fallback";

export interface EngagementLinkOption {
  /** Relative or absolute URL, null while the artifact does not exist yet. */
  href: string | null;
  /** The artifact exists and its stage did not fail — safe to insert into a draft. */
  ready: boolean;
  /** The pipeline failed during the stage that produces this artifact. */
  failed: boolean;
}

export interface EngagementLinks {
  build: EngagementLinkOption;
  fallback: EngagementLinkOption;
}

const BUILD_PHASE_STAGES = ["BUILDING", "BUILDING_COMPLETE", "DEPLOYING", "DEPLOYED"];
const DESIGN_PHASE_STAGES = ["DESIGNING", "DESIGN_COMPLETE"];

/**
 * Resolve the two candidate prototype links for a lead's draft email:
 * the deployed Jules build, and the chosen Stitch design concept as an
 * HTML fallback (used when the build failed or is not deployed yet).
 */
export function getEngagementLinks(params: {
  stage: string | null | undefined;
  failedStage: string | null | undefined;
  deploymentUrl: string | null | undefined;
  designConcepts: unknown;
  chosenDesign: number | null | undefined;
}): EngagementLinks {
  const isFailed = params.stage === "FAILED";
  const buildFailed = isFailed && BUILD_PHASE_STAGES.includes(params.failedStage ?? "");
  const designFailed = isFailed && DESIGN_PHASE_STAGES.includes(params.failedStage ?? "");

  const buildHref = params.deploymentUrl?.trim() ? params.deploymentUrl : null;

  const concepts = parseDesignConcepts(params.designConcepts);
  const chosen =
    params.chosenDesign != null && params.chosenDesign >= 0 && params.chosenDesign < concepts.length
      ? concepts[params.chosenDesign]
      : concepts[0];
  const fallbackHref = chosen
    ? (conceptHtmlHref(conceptProjectId(chosen), conceptScreenId(chosen), conceptLink(chosen)) ?? null)
    : null;

  return {
    build: { href: buildHref, ready: Boolean(buildHref) && !buildFailed, failed: buildFailed },
    fallback: { href: fallbackHref, ready: Boolean(fallbackHref) && !designFailed, failed: designFailed },
  };
}
