/**
 * Must be imported before `@/lib/inngest/client` (Inngest reads `process.env` at load time).
 */
import "dotenv/config";

// This harness only talks to `inngest dev` (see package.json `inngest:dev`). Cloud branch
// names in .env cause 404 "Branch environment does not exist" on `inngest.send` — ignore them here.
if (!process.env.INNGEST_DEV?.trim()) {
  process.env.INNGEST_DEV = "1";
  console.log(
    "[dry-run-engagement] INNGEST_DEV=1 (local inngest dev, default :8288). No cloud branch for this process.\n",
  );
}
delete process.env.INNGEST_ENV;
delete process.env.INNGEST_ENV;

if (process.env.ENGAGEMENT_DRY_RUN === undefined) {
  process.env.ENGAGEMENT_DRY_RUN = "true";
}
