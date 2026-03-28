import { describe, expect, it } from "vitest";
import {
  isWithinUtcCronDriftWindow,
  shouldSkipDuplicateRun,
  snapUtcTimeToNearestMinutes,
} from "@/lib/cron/prospecting-utc";

describe("snapUtcTimeToNearestMinutes", () => {
  it("snaps to a 15-minute grid (nearest)", () => {
    expect(snapUtcTimeToNearestMinutes("04:37", 15)).toBe("04:30");
    expect(snapUtcTimeToNearestMinutes("04:38", 15)).toBe("04:45");
    expect(snapUtcTimeToNearestMinutes("04:34", 15)).toBe("04:30");
  });
});

describe("isWithinUtcCronDriftWindow", () => {
  it("returns true at exact minute", () => {
    const now = new Date("2026-03-28T04:35:00.000Z");
    expect(isWithinUtcCronDriftWindow(now, "04:35")).toBe(true);
  });

  it("returns false far from target", () => {
    const now = new Date("2026-03-28T22:45:00.000Z");
    expect(isWithinUtcCronDriftWindow(now, "04:35")).toBe(false);
  });
});

describe("shouldSkipDuplicateRun", () => {
  it("skips daily when already ran same UTC day", () => {
    const last = new Date("2026-03-28T04:35:00.000Z");
    const now = new Date("2026-03-28T10:00:00.000Z");
    expect(shouldSkipDuplicateRun("daily", null, last, now)).toBe(true);
  });

  it("does not skip daily on a new UTC day", () => {
    const last = new Date("2026-03-27T04:35:00.000Z");
    const now = new Date("2026-03-28T04:35:00.000Z");
    expect(shouldSkipDuplicateRun("daily", null, last, now)).toBe(false);
  });
});
