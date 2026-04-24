-- Jules session activities: progressUpdated title/description for dashboard UX
-- https://jules.google/docs/api/reference/activities#progress-updated
ALTER TABLE "product_specs" ADD COLUMN "jules_progress_title" TEXT;
ALTER TABLE "product_specs" ADD COLUMN "jules_progress_description" TEXT;
