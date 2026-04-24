import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  JULES_RECONCILER_FETCH_COOLDOWN_MS,
  ON_READ_RECONCILE_BUILDING_SKIP_MS,
  shouldSkipJulesFetchInReconciler,
  shouldSkipOnReadReconcileForBuilding,
} from "@/lib/engagement/reconcile-throttle";

describe("shouldSkipJulesFetchInReconciler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-24T12:00:00.000Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false when Jules was never polled", () => {
    expect(shouldSkipJulesFetchInReconciler(null)).toBe(false);
  });

  it("returns true when last poll is newer than cooldown", () => {
    const ageMs = JULES_RECONCILER_FETCH_COOLDOWN_MS - 60_000;
    const recent = new Date(Date.now() - ageMs);
    expect(shouldSkipJulesFetchInReconciler(recent)).toBe(true);
  });

  it("returns false when last poll is older than cooldown", () => {
    const ageMs = JULES_RECONCILER_FETCH_COOLDOWN_MS + 60_000;
    const old = new Date(Date.now() - ageMs);
    expect(shouldSkipJulesFetchInReconciler(old)).toBe(false);
  });
});

describe("shouldSkipOnReadReconcileForBuilding", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-24T12:00:00.000Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false for non-BUILDING stages", () => {
    const recent = new Date(Date.now() - 30_000);
    expect(shouldSkipOnReadReconcileForBuilding({ stage: "DESIGN_COMPLETE", julesLastPolledAt: recent })).toBe(false);
  });

  it("returns false when BUILDING but never polled", () => {
    expect(shouldSkipOnReadReconcileForBuilding({ stage: "BUILDING", julesLastPolledAt: null })).toBe(false);
  });

  it("returns true when BUILDING and poll is within skip window", () => {
    const ageMs = ON_READ_RECONCILE_BUILDING_SKIP_MS - 60_000;
    const recent = new Date(Date.now() - ageMs);
    expect(shouldSkipOnReadReconcileForBuilding({ stage: "BUILDING", julesLastPolledAt: recent })).toBe(true);
  });

  it("returns false when BUILDING but poll is older than skip window", () => {
    const ageMs = ON_READ_RECONCILE_BUILDING_SKIP_MS + 60_000;
    const old = new Date(Date.now() - ageMs);
    expect(shouldSkipOnReadReconcileForBuilding({ stage: "BUILDING", julesLastPolledAt: old })).toBe(false);
  });
});
