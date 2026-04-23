-- DropForeignKey
ALTER TABLE "stage_transitions" DROP CONSTRAINT "stage_transitions_product_spec_id_fkey";

-- AddForeignKey
ALTER TABLE "stage_transitions" ADD CONSTRAINT "stage_transitions_product_spec_id_fkey" FOREIGN KEY ("product_spec_id") REFERENCES "product_specs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
