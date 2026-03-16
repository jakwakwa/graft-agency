-- AlterTable
ALTER TABLE "prospect_queue" ADD COLUMN "client_id" TEXT,
ADD COLUMN "lead_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "prospect_queue_lead_id_key" ON "prospect_queue"("lead_id");

-- CreateIndex
CREATE INDEX "prospect_queue_client_id_status_idx" ON "prospect_queue"("client_id", "status");

-- AddForeignKey
ALTER TABLE "prospect_queue" ADD CONSTRAINT "prospect_queue_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_queue" ADD CONSTRAINT "prospect_queue_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
