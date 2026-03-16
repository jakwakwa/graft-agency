# Required Reading: Critical Patterns

Patterns that must be followed to avoid recurring failures. Subagents and future sessions should apply these before code generation.

---

## 1. Vitest Must Load .env Before Prisma (ALWAYS REQUIRED)

### ❌ WRONG (Causes `DATABASE_URL is required to initialise Prisma`)
```ts
// vitest.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { setupFiles: ["tests/setup.ts"] },
});
```

Relying on setup.ts or Bun to load .env—Prisma imports before setup runs; process.env is empty.

### ✅ CORRECT
```ts
// vitest.config.ts
import "dotenv/config";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { setupFiles: ["tests/setup.ts"] },
});
```

**Why:** Vitest runs in a separate process and does not load `.env` automatically. The config file is the first module evaluated; importing `dotenv/config` at the top populates `process.env` before any test file (or Prisma) loads.

**Placement/Context:** Any project where Vitest tests use Prisma, API keys, or other env-dependent code. Add `import "dotenv/config"` as the first line of `vitest.config.ts`.

**Documented in:** `docs/solutions/integration-issues/vitest-database-url-not-loaded-testing-20260316.md`

---
