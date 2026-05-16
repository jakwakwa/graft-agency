/*
  Warnings:

  - You are about to drop the column `paddle_price_id` on the `product_specs` table. All the data in the column will be lost.
  - You are about to drop the column `paddle_product_id` on the `product_specs` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "clients_clerk_organization_id_key";

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "subscription_addons" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "product_specs" DROP COLUMN "paddle_price_id",
DROP COLUMN "paddle_product_id",
ADD COLUMN     "paddle_transaction_id" TEXT;
