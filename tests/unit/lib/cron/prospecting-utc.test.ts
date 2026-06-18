import { describe, expect, it } from "vitest";
import { shouldSkipDuplicateRun } from "@/lib/cron/prospecting-utc";

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
