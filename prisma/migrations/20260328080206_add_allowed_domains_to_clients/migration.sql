-- AlterTable
ALTER TABLE "clients" ADD COLUMN "allowed_domains" TEXT[] NOT NULL DEFAULT '{}';
