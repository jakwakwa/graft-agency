-- Remove the Attio integration column from leads.
ALTER TABLE "leads" DROP COLUMN "attio_record_id";
