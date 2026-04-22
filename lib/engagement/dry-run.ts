/**
 * When `ENGAGEMENT_DRY_RUN=true`, Vercel deploy, Paddle, and Resend are stubbed or skipped
 * (see `offer-dispatcher`, `jules-builder` Vercel link placeholder). Real Gemini, Stitch, Jules, and GitHub may still run.
 */
export function isEngagementDryRun(): boolean {
  return process.env.ENGAGEMENT_DRY_RUN === "true";
}
