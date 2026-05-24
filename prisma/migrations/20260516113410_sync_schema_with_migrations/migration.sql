/*
  Warnings:

  - You are about to drop the column `paddle_price_id` on the `product_specs` table. All the data in the column will be lost.
  - You are about to drop the column `paddle_product_id` on the `product_specs` table. All the data in the column will be lost.

*/
-- DropIndex: guard for databases where this was already removed manually or by a prior migration
DROP INDEX IF EXISTS "clients_clerk_organization_id_key";

-- AlterTable clients: guard for databases where this column was already applied outside migrations
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "subscription_addons" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable product_specs: swap paddle_price_id/paddle_product_id → paddle_transaction_id
-- Guards protect databases that were altered ahead of this migration file
ALTER TABLE "product_specs"
  DROP COLUMN IF EXISTS "paddle_price_id",
  DROP COLUMN IF EXISTS "paddle_product_id";

ALTER TABLE "product_specs"
  ADD COLUMN IF NOT EXISTS "paddle_transaction_id" TEXT;
