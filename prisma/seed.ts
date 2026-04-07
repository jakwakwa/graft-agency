import "dotenv/config";

/**
 * Intentionally does not insert demo, mock, or sample rows into your database.
 * Create `Client` records through onboarding, admin APIs, or Clerk webhooks.
 */
async function main(): Promise<void> {
  console.log("Prisma seed: skipped (no default data). Use onboarding or admin APIs to create clients.");
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
