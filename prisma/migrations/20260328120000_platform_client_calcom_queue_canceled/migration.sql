-- AlterEnum
ALTER TYPE "QueueStatus" ADD VALUE 'CANCELED';

-- AlterTable
ALTER TABLE "clients" ADD COLUMN "is_platform_client" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "clients_is_platform_client_idx" ON "clients"("is_platform_client");

-- AlterTable
ALTER TABLE "agent_configs" ADD COLUMN "cal_com_username" TEXT;
ALTER TABLE "agent_configs" ADD COLUMN "default_event_slug" TEXT;
