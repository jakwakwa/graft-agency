import { describe, expect, test } from "bun:test";
import {
  ENGAGEMENT_STAGE_ORDER,
  formatStageLabel,
  getCompletionPercent,
  getStageCategory,
  getStepIndex,
  getStepStatus,
  isFailedStage,
  isInProgressStage,
  isTerminalStage,
} from "./engagement-stages";

describe("ENGAGEMENT_STAGE_ORDER", () => {
  test("has 11 entries", () => {
    expect(ENGAGEMENT_STAGE_ORDER.length).toBe(11);
  });
});

describe("getStepIndex", () => {
  test("PROFILING is step 0", () => {
    expect(getStepIndex("PROFILING")).toBe(0);
  });

  test("WRITING_PRD is step 1", () => {
    expect(getStepIndex("WRITING_PRD")).toBe(1);
  });

  test("WRITING_STRATEGY is step 2", () => {
    expect(getStepIndex("WRITING_STRATEGY")).toBe(2);
  });

  test("DESIGNING is step 3", () => {
    expect(getStepIndex("DESIGNING")).toBe(3);
  });

  test("BUILDING is step 4", () => {
    expect(getStepIndex("BUILDING")).toBe(4);
  });

  test("OFFER_SENT has no pipeline step", () => {
    expect(getStepIndex("OFFER_SENT")).toBe(-1);
  });

  test("NOT_STARTED returns -1", () => {
    expect(getStepIndex("NOT_STARTED")).toBe(-1);
  });

  test("FAILED returns -1", () => {
    expect(getStepIndex("FAILED")).toBe(-1);
  });

  test("PENDING returns -1", () => {
    expect(getStepIndex("PENDING")).toBe(-1);
  });
});

describe("isTerminalStage", () => {
  test("OFFER_SENT is terminal", () => {
    expect(isTerminalStage("OFFER_SENT")).toBe(true);
  });

  test("DEPLOYED is terminal", () => {
    expect(isTerminalStage("DEPLOYED")).toBe(true);
  });

  test("FAILED is terminal", () => {
    expect(isTerminalStage("FAILED")).toBe(true);
  });

  test("BUILDING is not terminal", () => {
    expect(isTerminalStage("BUILDING")).toBe(false);
  });

  test("NOT_STARTED is not terminal", () => {
    expect(isTerminalStage("NOT_STARTED")).toBe(false);
  });
});

describe("isFailedStage", () => {
  test("FAILED is true", () => {
    expect(isFailedStage("FAILED")).toBe(true);
  });

  test("OFFER_SENT is false", () => {
    expect(isFailedStage("OFFER_SENT")).toBe(false);
  });
});

describe("isInProgressStage", () => {
  test("PROFILING is in progress", () => {
    expect(isInProgressStage("PROFILING")).toBe(true);
  });

  test("NOT_STARTED is not in progress", () => {
    expect(isInProgressStage("NOT_STARTED")).toBe(false);
  });

  test("OFFER_SENT is not in progress", () => {
    expect(isInProgressStage("OFFER_SENT")).toBe(false);
  });
});

describe("getStageCategory", () => {
  test("NOT_STARTED is not_started", () => {
    expect(getStageCategory("NOT_STARTED")).toBe("not_started");
  });

  test("PENDING is not_started", () => {
    expect(getStageCategory("PENDING")).toBe("not_started");
  });

  test("PROFILING is in_progress", () => {
    expect(getStageCategory("PROFILING")).toBe("in_progress");
  });

  test("BUILDING is in_progress", () => {
    expect(getStageCategory("BUILDING")).toBe("in_progress");
  });

  test("OFFER_SENT is complete", () => {
    expect(getStageCategory("OFFER_SENT")).toBe("complete");
  });

  test("DEPLOYED is complete", () => {
    expect(getStageCategory("DEPLOYED")).toBe("complete");
  });

  test("FAILED is failed", () => {
    expect(getStageCategory("FAILED")).toBe("failed");
  });
});

describe("formatStageLabel", () => {
  test("WRITING_PRD returns 'Writing PRD'", () => {
    expect(formatStageLabel("WRITING_PRD")).toBe("Writing PRD");
  });
});

describe("getCompletionPercent", () => {
  test("NOT_STARTED is 0%", () => {
    expect(getCompletionPercent("NOT_STARTED")).toBe(0);
  });

  test("OFFER_SENT is 100%", () => {
    expect(getCompletionPercent("OFFER_SENT")).toBe(100);
  });
});

describe("getStepStatus", () => {
  test("step 0 is 'current' when stage is PROFILING", () => {
    expect(getStepStatus(0, "PROFILING")).toBe("current");
  });

  test("step 0 is 'done' when stage is PRD_WRITTEN", () => {
    expect(getStepStatus(0, "PRD_WRITTEN")).toBe("done");
  });

  test("step 4 is 'pending' when stage is PROFILING", () => {
    expect(getStepStatus(4, "PROFILING")).toBe("pending");
  });

  test("Strategy step is 'done' when stage is DESIGNING", () => {
    expect(getStepStatus(2, "DESIGNING")).toBe("done");
  });
});
