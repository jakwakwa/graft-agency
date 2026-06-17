-- Drop unwired/incoherent prospecting controls.
-- searchEnabled: search is the cron's only action, so a separate toggle is meaningless.
-- cronTime: the SAST time picker was never read by the scheduler.

ALTER TABLE "prospecting_configs" DROP COLUMN "search_enabled";
ALTER TABLE "prospecting_configs" DROP COLUMN "cron_time";
