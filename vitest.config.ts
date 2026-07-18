import "dotenv/config";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Unit tests that mock Prisma still import the singleton through transitive
// dependencies. Give those imports a syntactically valid local fallback,
// while real database tests continue to use the explicit test database.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  "postgresql://test:test@127.0.0.1:1/graft_test";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/e2e/**"],
    environment: "jsdom",
    // Integration suites share one test database. Serializing files prevents
    // cross-suite cleanup races and unnamed prepared-statement collisions.
    fileParallelism: false,
    globals: true,
    setupFiles: ["tests/setup.ts"],
  },
});
