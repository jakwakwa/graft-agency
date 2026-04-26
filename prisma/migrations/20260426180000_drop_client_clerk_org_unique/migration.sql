-- Drop the unique constraint on clerk_organization_id.
-- The new member-as-tenant model provisions one Client per Clerk user (keyed by
-- clerkUserId), so multiple clients can belong to the same agency organization.
-- The @unique constraint would cause the second member webhook upsert to fail.
ALTER TABLE "clients" DROP CONSTRAINT IF EXISTS "clients_clerk_organization_id_key";
