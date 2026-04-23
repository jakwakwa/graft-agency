-- Track Render services provisioned per Jules build.
ALTER TABLE "product_specs"
ADD COLUMN "render_service_id" TEXT,
ADD COLUMN "render_service_name" TEXT;
