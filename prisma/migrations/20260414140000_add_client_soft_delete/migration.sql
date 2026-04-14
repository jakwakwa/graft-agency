-- AlterTable: add deleted_at for soft delete support
ALTER TABLE "clients" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "clients_deleted_at_idx" ON "clients"("deleted_at");
