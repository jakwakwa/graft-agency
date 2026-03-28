-- AlterTable
ALTER TABLE "prospecting_configs" ADD COLUMN     "cron_day" INTEGER,
ADD COLUMN     "cron_frequency" TEXT NOT NULL DEFAULT 'daily',
ADD COLUMN     "cron_start_date" TIMESTAMP(3),
ADD COLUMN     "cron_time" TEXT NOT NULL DEFAULT '22:45';
