import { getISOWeek, getISOWeekYear } from "date-fns";

export function isSameUtcCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function shouldSkipDuplicateRun(
  frequency: "daily" | "weekly",
  cronDay: number | null,
  lastRun: Date | null,
  now: Date,
): boolean {
  if (!lastRun) return false;
  if (frequency === "daily") {
    return isSameUtcCalendarDay(lastRun, now);
  }
  if (frequency === "weekly" && cronDay !== null && cronDay !== undefined) {
    return (
      getISOWeekYear(lastRun) === getISOWeekYear(now) &&
      getISOWeek(lastRun) === getISOWeek(now) &&
      lastRun.getUTCDay() === cronDay
    );
  }
  return false;
}
