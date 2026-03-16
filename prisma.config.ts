// Prisma v7 configuration file
// https://www.prisma.io/docs/orm/prisma-migrate/configuration
// works with: installed dotenv@17.3.1
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
