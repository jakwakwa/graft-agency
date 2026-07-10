export const BUILD_ALREADY_PURCHASED_CODE = "BUILD_ALREADY_PURCHASED" as const;

/** Paddle price IDs for one-time website builds (Landing Page / SMB). */
export function getBuildPriceIds(): string[] {
  return [process.env.PADDLE_PRICE_LANDING, process.env.PADDLE_PRICE_SMB].filter(Boolean) as string[];
}

/** Calendar-month window used by the max-one-build-per-workspace-per-month rule. */
export function startOfCurrentMonthUtc(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
