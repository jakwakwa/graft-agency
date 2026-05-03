-- CreateEnum
CREATE TYPE "ChatUsageStatus" AS ENUM ('ALLOWED', 'DENIED');

-- CreateEnum
CREATE TYPE "OperationalEventCategory" AS ENUM ('CHAT', 'WEBHOOK', 'AI_USAGE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "OperationalEventStatus" AS ENUM ('ALLOWED', 'DENIED', 'INFO', 'SUCCESS', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "WebhookProvider" AS ENUM ('CAL', 'CLERK', 'PADDLE', 'VERCEL');

-- CreateEnum
CREATE TYPE "WebhookReceiptStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "chat_usage" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "status" "ChatUsageStatus" NOT NULL,
    "denial_reason" TEXT,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "model" TEXT,
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "total_tokens" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_events" (
    "id" TEXT NOT NULL,
    "client_id" TEXT,
    "category" "OperationalEventCategory" NOT NULL,
    "event_type" TEXT NOT NULL,
    "status" "OperationalEventStatus" NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operational_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_receipts" (
    "id" TEXT NOT NULL,
    "provider" "WebhookProvider" NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signature_verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "WebhookReceiptStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_usage_client_id_created_at_idx" ON "chat_usage"("client_id", "created_at");

-- CreateIndex
CREATE INDEX "chat_usage_status_created_at_idx" ON "chat_usage"("status", "created_at");

-- CreateIndex
CREATE INDEX "operational_events_client_id_created_at_idx" ON "operational_events"("client_id", "created_at");

-- CreateIndex
CREATE INDEX "operational_events_category_status_created_at_idx" ON "operational_events"("category", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_receipts_provider_event_id_key" ON "webhook_receipts"("provider", "event_id");

-- CreateIndex
CREATE INDEX "webhook_receipts_provider_status_received_at_idx" ON "webhook_receipts"("provider", "status", "received_at");

-- CreateIndex
CREATE INDEX "webhook_receipts_status_received_at_idx" ON "webhook_receipts"("status", "received_at");

-- AddForeignKey
ALTER TABLE "chat_usage" ADD CONSTRAINT "chat_usage_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_events" ADD CONSTRAINT "operational_events_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
