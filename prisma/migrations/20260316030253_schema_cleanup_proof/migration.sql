-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_client_id_fkey";

-- CreateIndex
CREATE INDEX "clients_subdomain_idx" ON "clients"("subdomain");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
