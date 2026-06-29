-- Strategy Engine stage: insert two new EngagementStage values between the
-- PRD and Design phases. Positioned with BEFORE 'DESIGNING' so the DB enum
-- order matches prisma/schema.prisma (avoids enum-recreation drift).
ALTER TYPE "EngagementStage" ADD VALUE IF NOT EXISTS 'WRITING_STRATEGY' BEFORE 'DESIGNING';
ALTER TYPE "EngagementStage" ADD VALUE IF NOT EXISTS 'STRATEGY_COMPLETE' BEFORE 'DESIGNING';

-- Campaign Campaigner inputs/artifacts on ProductSpec.
-- engagement_objectives: operator-supplied conversion goals captured at approval.
-- build_variant: "landing" | "campaign" — which artifact Jules builds.
-- campaign_sop: Strategy Engine blueprint (refined email, narrative, visual framework).
ALTER TABLE "product_specs" ADD COLUMN "engagement_objectives" TEXT;
ALTER TABLE "product_specs" ADD COLUMN "build_variant" TEXT;
ALTER TABLE "product_specs" ADD COLUMN "campaign_sop" JSONB;
