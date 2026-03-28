-- CreateTable
CREATE TABLE "prospecting_configs" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "cron_enabled" BOOLEAN NOT NULL DEFAULT false,
    "search_enabled" BOOLEAN NOT NULL DEFAULT false,
    "search_criteria" JSONB,
    "outreach_from_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospecting_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prospecting_configs_client_id_key" ON "prospecting_configs"("client_id");

-- AddForeignKey
ALTER TABLE "prospecting_configs" ADD CONSTRAINT "prospecting_configs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
