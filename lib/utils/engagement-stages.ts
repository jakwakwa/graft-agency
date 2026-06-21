// The 12 ordered stages (FAILED is terminal but out-of-band)
export const ENGAGEMENT_STAGE_ORDER = [
  "PENDING",
  "PROFILING",
  "PROFILED",
  "WRITING_PRD",
  "PRD_WRITTEN",
  "DESIGNING",
  "DESIGN_COMPLETE",
  "BUILDING",
  "BUILDING_COMPLETE",
] as const;

export type EngagementStageKey = (typeof ENGAGEMENT_STAGE_ORDER)[number] | "FAILED" | "NOT_STARTED";

// UK English labels for all 14 states
export const STAGE_LABELS: Record<string, string> = {
  NOT_STARTED: "Not Started",
  PENDING: "Pending",
  PROFILING: "Profiling",
  PROFILED: "Profiled",
  WRITING_PRD: "Writing PRD",
  PRD_WRITTEN: "PRD Written",
  DESIGNING: "Designing",
  DESIGN_COMPLETE: "Design Complete",
  BUILDING: "Building",
  BUILDING_COMPLETE: "Building Complete",
  FAILED: "Failed",
};

// The 6 pipeline steps shown in the UI stepper (matching Stitch design)
export interface PipelineStep {
  label: string; // User-facing label
  stages: string[]; // Which EngagementStage values map to this step
  icon: string; // Lucide icon name
}

export const PIPELINE_STEPS: PipelineStep[] = [
  { label: "Understanding", stages: ["PROFILING", "PROFILED"], icon: "Brain" },
  { label: "Direction", stages: ["WRITING_PRD", "PRD_WRITTEN"], icon: "FileText" },
  { label: "Design", stages: ["DESIGNING", "DESIGN_COMPLETE"], icon: "Palette" },
  { label: "Build", stages: ["BUILDING", "BUILDING_COMPLETE"], icon: "Hammer" },
];

/**
 * Get the 0-based step index (0–5) for a given stage.
 * Returns -1 for NOT_STARTED, FAILED, or PENDING (not yet in a pipeline step).
 */
export function getStepIndex(stage: string): number {
  if (stage === "NOT_STARTED" || stage === "FAILED" || stage === "PENDING") {
    return -1;
  }
  const idx = PIPELINE_STEPS.findIndex((step) => step.stages.includes(stage));
  return idx;
}

/**
 * Get completion percentage (0–100) based on current stage.
 * Based on how many of the 6 steps are considered "done".
 *
 * Step completion:
 *   PENDING / NOT_STARTED        → 0%  (0 steps done)
 *   PROFILING / PROFILED          → 0%  (step 0 is current, 0 done before it)
 *   WRITING_PRD / PRD_WRITTEN     → 20% (1 step done)
 *   DESIGNING / DESIGN_COMPLETE   → 55% (2 steps done)
 *   BUILDING / BUILDING_COMPLETE  → 100% (3 steps done)
 *
 * step 5 pending)
 *   OFFER_SENT                    → 100% (all 6 steps done)
 *   FAILED                        → percentage based on how far along the failure occurred
 */
export function getCompletionPercent(stage: string): number {
  if (stage === "NOT_STARTED" || stage === "PENDING") {
    return 0;
  }

  if (stage === "FAILED") {
    return 0;
  }
  const stepIdx = getStepIndex(stage);
  if (stepIdx <= 0) {
    return 0;
  }
  // Each completed step is worth ~16.67% (100/6)
  return Math.round((stepIdx / 3) * 100);
}

/**
 * Is this a terminal stage? (DEPLOYED, OFFER_SENT, or FAILED)
 */
export function isTerminalStage(stage: string): boolean {
  return stage === "DEPLOYED" || stage === "OFFER_SENT" || stage === "FAILED";
}

/**
 * Is this a failed stage?
 */
export function isFailedStage(stage: string): boolean {
  return stage === "FAILED";
}

/**
 * Is this in progress?
 * Non-terminal, non-NOT_STARTED, non-FAILED, non-PENDING stage.
 */
export function isInProgressStage(stage: string): boolean {
  if (stage === "NOT_STARTED" || stage === "PENDING" || stage === "FAILED") {
    return false;
  }
  return getStepIndex(stage) >= 0;
}

/**
 * Get status category for badge display.
 */
export function getStageCategory(stage: string): "not_started" | "in_progress" | "complete" | "failed" {
  if (stage === "NOT_STARTED" || stage === "PENDING") {
    return "not_started";
  }
  if (stage === "FAILED") {
    return "failed";
  }
  if (stage === "OFFER_SENT" || stage === "DEPLOYED") {
    return "complete";
  }
  return "in_progress";
}

/**
 * UK English label for a stage.
 */
export function formatStageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? stage;
}

/**
 * Get step status relative to the current stage.
 *
 * Rules:
 * - "done"    if stepIndex < currentStepIndex
 * - "current" if stepIndex === currentStepIndex (and stage is not terminal/failed)
 * - For OFFER_SENT: step 5 is "done"
 * - For DEPLOYED: step 4 is "done", step 5 is "pending"
 * - For FAILED: all steps up to the failed step's index return "done";
 *               the failed step itself returns "current" (UI handles failed visual)
 * - "pending"  if stepIndex > currentStepIndex
 */
export function getStepStatus(stepIndex: number, currentStage: string): "done" | "current" | "pending" {
  if (currentStage === "OFFER_SENT") {
    // All 6 steps are done
    return "done";
  }

  if (currentStage === "DEPLOYED") {
    // Steps 0-4 done, step 5 pending
    if (stepIndex <= 4) return "done";
    return "pending";
  }

  const currentStepIdx = getStepIndex(currentStage);

  if (currentStepIdx === -1) {
    // NOT_STARTED / PENDING / FAILED with no step mapping
    if (currentStage === "FAILED") {
      // FAILED with no recognised step — treat all as pending
      return "pending";
    }
    return "pending";
  }

  if (stepIndex < currentStepIdx) return "done";
  if (stepIndex === currentStepIdx) return "current";
  return "pending";
}
