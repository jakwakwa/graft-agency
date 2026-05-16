-- Migration: engagement durability
-- Adds failure tracking, orchestrator health, reconciliation metadata,
-- idempotency sentinels, and StageTransition audit table to ProductSpec.

ALTER TABLE "product_specs"
  ADD COLUMN "stage_version"              INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "failed_stage"               "EngagementStage",
  ADD COLUMN "failed_at"                  TIMESTAMP(3),
  ADD COLUMN "failure_reason"             TEXT,
  ADD COLUMN "failure_source"             TEXT,
  ADD COLUMN "inngest_run_id"             TEXT,
  ADD COLUMN "inngest_run_status"         TEXT,
  ADD COLUMN "last_reconciled_at"         TIMESTAMP(3),
  ADD COLUMN "last_reconciled_by"         TEXT,
  ADD COLUMN "stitch_run_intent_key"      TEXT,
  ADD COLUMN "jules_session_intent_key"   TEXT,
  ADD COLUMN "render_service_intent_key"  TEXT,
  ADD COLUMN "stitch_project_id"          TEXT,
  ADD COLUMN "stitch_run_id"              TEXT;

CREATE UNIQUE INDEX "product_specs_stitch_run_intent_key_key"    ON "product_specs"("stitch_run_intent_key");
CREATE UNIQUE INDEX "product_specs_jules_session_intent_key_key"  ON "product_specs"("jules_session_intent_key");
CREATE UNIQUE INDEX "product_specs_render_service_intent_key_key" ON "product_specs"("render_service_intent_key");

CREATE INDEX "product_specs_stage_updated_at_idx" ON "product_specs"("stage", "updated_at");

CREATE TABLE "stage_transitions" (
  "id"              TEXT NOT NULL,
  "product_spec_id" TEXT NOT NULL,
  "lead_id"         TEXT NOT NULL,
  "from_stage"      "EngagementStage",
  "to_stage"        "EngagementStage" NOT NULL,
  "source"          TEXT NOT NULL,
  "reason"          TEXT,
  "inngest_run_id"  TEXT,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "stage_transitions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "stage_transitions_product_spec_id_fkey"
    FOREIGN KEY ("product_spec_id") REFERENCES "product_specs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "stage_transitions_lead_id_created_at_idx" ON "stage_transitions"("lead_id", "created_at");
