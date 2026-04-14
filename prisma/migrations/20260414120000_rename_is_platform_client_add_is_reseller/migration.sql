-- AlterTable: rename is_platform_client → is_platform_owner
ALTER TABLE "clients" RENAME COLUMN "is_platform_client" TO "is_platform_owner";

-- DropIndex
DROP INDEX "clients_is_platform_client_idx";

-- CreateIndex
CREATE INDEX "clients_is_platform_owner_idx" ON "clients"("is_platform_owner");

-- AlterTable: add is_reseller
ALTER TABLE "clients" ADD COLUMN "is_reseller" BOOLEAN NOT NULL DEFAULT false;
