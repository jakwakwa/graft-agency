-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "clerk_user_id" TEXT,
ADD COLUMN     "email" TEXT,
ALTER COLUMN "clerk_organization_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "clients_clerk_user_id_key" ON "clients"("clerk_user_id");

-- CreateIndex
CREATE INDEX "clients_clerk_user_id_idx" ON "clients"("clerk_user_id");

