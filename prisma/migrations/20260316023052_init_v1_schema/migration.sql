-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('INBOUND', 'OUTBOUND_PROSPECT');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('SCRAPED', 'DRAFT_PENDING', 'CONTACTED', 'REPLIED', 'BOOKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "clerk_organization_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "industry" TEXT,
    "website_url" TEXT,
    "subdomain" TEXT,
    "cal_com_user_id" INTEGER,
    "subscription_active" BOOLEAN NOT NULL DEFAULT false,
    "subscription_status" TEXT NOT NULL DEFAULT 'inactive',
    "paddle_customer_id" TEXT,
    "paddle_subscription_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_configs" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "system_prompt" TEXT NOT NULL,
    "knowledge_base" JSONB,
    "agent_name" TEXT,
    "greeting_message" TEXT,
    "widget_primary_colour" TEXT DEFAULT '#000000',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "client_id" TEXT,
    "customer_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "source" "LeadSource" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'SCRAPED',
    "scraped_data" JSONB,
    "chat_transcript" JSONB,
    "cal_booking_uid" TEXT,
    "next_action_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospect_queue" (
    "id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "website_url" TEXT NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospect_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "client_id" TEXT,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_clerk_organization_id_key" ON "clients"("clerk_organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_subdomain_key" ON "clients"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "clients_paddle_customer_id_key" ON "clients"("paddle_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_paddle_subscription_id_key" ON "clients"("paddle_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_configs_client_id_key" ON "agent_configs"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "leads_cal_booking_uid_key" ON "leads"("cal_booking_uid");

-- CreateIndex
CREATE INDEX "leads_client_id_status_idx" ON "leads"("client_id", "status");

-- CreateIndex
CREATE INDEX "prospect_queue_status_idx" ON "prospect_queue"("status");

-- CreateIndex
CREATE INDEX "email_templates_client_id_is_default_idx" ON "email_templates"("client_id", "is_default");

-- AddForeignKey
ALTER TABLE "agent_configs" ADD CONSTRAINT "agent_configs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
