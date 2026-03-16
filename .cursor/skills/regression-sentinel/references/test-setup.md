# Test Setup Patterns

Reference for the regression-sentinel skill. Ensures tests can run before the sentinel executes them.

## 1. Vitest: DATABASE_URL Not Loaded

**Symptom:** Tests that import Prisma fail with `Error: DATABASE_URL is required to initialise Prisma` before any test runs.

**Cause:** Vitest does not load `.env` automatically. `process.env.DATABASE_URL` is undefined when Prisma initialises.

**Fix:** Add `import "dotenv/config"` as the first line of `vitest.config.ts`:

```ts
// vitest.config.ts
import "dotenv/config";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({ /* ... */ });
```

**When to apply:** Before running regression-sentinel on integration tests that use Prisma. If tests fail at import time with "DATABASE_URL is required", apply this fix first.

**Documented in:** `docs/solutions/integration-issues/vitest-database-url-not-loaded-testing-20260316.md`
