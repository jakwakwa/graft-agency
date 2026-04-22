-- AlterTable
ALTER TABLE "product_specs" ADD COLUMN     "jules_last_polled_at" TIMESTAMP(3),
ADD COLUMN     "jules_session_id" TEXT,
ADD COLUMN     "jules_state" TEXT,
ADD COLUMN     "pull_request_url" TEXT;
