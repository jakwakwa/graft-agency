# Vitest Env Setup Patterns

Reference for the vitest-env-setup skill. Source: `docs/solutions/integration-issues/vitest-database-url-not-loaded-testing-20260316.md`.

## 1. Load .env Before Any Other Imports

**Symptom:** `Error: DATABASE_URL is required to initialise Prisma` when running Vitest tests that import Prisma.

**Cause:** Vitest does not load `.env`. `process.env.DATABASE_URL` is undefined when Prisma initialises.

### ❌ WRONG

```ts
// vitest.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { setupFiles: ["tests/setup.ts"] },
});
```

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

**Placement:** `import "dotenv/config"` must be the first import in `vitest.config.ts`. The config is the first module Vitest evaluates; dotenv must run before any other code (including transitive imports from plugins) that might read `process.env`.

**Applies to:** Any env var used by tests or their imports: `DATABASE_URL`, `DIRECT_DATABASE_URL`, API keys, etc.
