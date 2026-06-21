// Prisma v7 configuration file
// https://www.prisma.io/docs/orm/prisma-migrate/configuration
// works with: installed dotenv@17.3.1
import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma migrate` connects with datasource.url and needs a DIRECT postgresql://
// connection string (Prisma Postgres host: db.prisma.io). The prisma+postgres://
// Accelerate / pooled URL the app uses at runtime is rejected by the migrate engine
// with P1013 ("scheme is not recognized"), so it must NOT be used here.
//
// Prefer DIRECT_DATABASE_URL (set in CI / the deploy environment). Fall back to
// DATABASE_URL for local development, where .env already holds a direct postgresql:// URL.
const migrationUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error(
    "Prisma migrations require a direct postgresql:// connection string. " +
      "Set DIRECT_DATABASE_URL (preferred) or DATABASE_URL.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationUrl,
  },
});
