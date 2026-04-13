-- CreateEnum
CREATE TYPE "EngagementStage" AS ENUM ('PENDING', 'PROFILING', 'PROFILED', 'WRITING_PRD', 'PRD_WRITTEN', 'DESIGNING', 'DESIGN_COMPLETE', 'BUILDING', 'BUILDING_COMPLETE', 'DEPLOYING', 'DEPLOYED', 'OFFER_SENT', 'FAILED');

-- CreateTable
CREATE TABLE "product_specs" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "stage" "EngagementStage" NOT NULL DEFAULT 'PENDING',
    "profiled_needs" JSONB,
    "prd_content" TEXT,
    "design_concepts" JSONB,
    "chosen_design" INTEGER,
    "github_repo" TEXT,
    "github_issue_url" TEXT,
    "deployment_url" TEXT,
    "paddle_product_id" TEXT,
    "paddle_price_id" TEXT,
    "offer_sent_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_specs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_specs_lead_id_key" ON "product_specs"("lead_id");

-- CreateIndex
CREATE INDEX "product_specs_client_id_stage_idx" ON "product_specs"("client_id", "stage");

-- CreateIndex
CREATE INDEX "product_specs_lead_id_idx" ON "product_specs"("lead_id");

-- AddForeignKey
ALTER TABLE "product_specs" ADD CONSTRAINT "product_specs_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_specs" ADD CONSTRAINT "product_specs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
