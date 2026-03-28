import { getISOWeek, getISOWeekYear } from "date-fns";

/** Snap stored UTC HH:mm to a minute grid so ticks (e.g. every 15 min) align with the saved time. */
export function snapUtcTimeToNearestMinutes(cronTimeUtc: string, gridMinutes: number): string {
  const parts = cronTimeUtc.split(":");
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  const total = h * 60 + m;
  const snapped = Math.round(total / gridMinutes) * gridMinutes;
  const dayWrap = ((snapped % 1440) + 1440) % 1440;
  const hh = Math.floor(dayWrap / 60);
  const mm = dayWrap % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Tick invocations may land a few minutes off; keep tolerance wide enough for 15-minute ticks. */
export function isWithinUtcCronDriftWindow(now: Date, cronTimeUtc: string, toleranceMinutes = 15): boolean {
  const minutesNow = now.getUTCHours() * 60 + now.getUTCMinutes();
  const parts = cronTimeUtc.split(":");
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  const target = h * 60 + m;
  const diff = Math.abs(minutesNow - target);
  const wrapped = Math.min(diff, 1440 - diff);
  return wrapped <= toleranceMinutes;
}

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
