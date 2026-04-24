/**
 * Limits engagement reconciler + on-read traffic so we do not hammer Jules
 * (sessions GET) or Inngest when the dedicated jules-poller is already updating
 * `julesLastPolledAt`. See https://jules.google/docs/api/reference/activities
 * for richer progress via Activities (future UI / polling option).
 */

/** Scheduled cron: only fan out specs idle at least this long (was 60s). */
export const RECONCILER_CRON_MIN_STALE_MS = 3 * 60 * 1000;

/** Skip reconciler `getJulesSession` if something polled Jules recently. */
export const JULES_RECONCILER_FETCH_COOLDOWN_MS = 4 * 60 * 1000;

/** During BUILDING, suppress on-read reconcile while Jules poll is fresh (browser polls often). */
export const ON_READ_RECONCILE_BUILDING_SKIP_MS = 5 * 60 * 1000;

function parsePollTime(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function shouldSkipJulesFetchInReconciler(julesLastPolledAt: Date | string | null): boolean {
  const d = parsePollTime(julesLastPolledAt);
  if (!d) return false;
  return Date.now() - d.getTime() < JULES_RECONCILER_FETCH_COOLDOWN_MS;
}

export function shouldSkipOnReadReconcileForBuilding(params: {
  stage: string;
  julesLastPolledAt: Date | string | null;
}): boolean {
  if (params.stage !== "BUILDING") return false;
  const d = parsePollTime(params.julesLastPolledAt);
  if (!d) return false;
  return Date.now() - d.getTime() < ON_READ_RECONCILE_BUILDING_SKIP_MS;
}
