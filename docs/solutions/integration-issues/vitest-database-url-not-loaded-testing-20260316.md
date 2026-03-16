---
module: Testing Stack
date: 2026-03-16
problem_type: integration_issue
component: vitest
symptoms:
  - "Vitest tests that import Prisma fail with: `Error: DATABASE_URL is required to initialise Prisma`"
  - "`process.env.DATABASE_URL` is undefined when Prisma singleton initialises during test run"
root_cause: env_not_loaded
resolution_type: code_fix
severity: high
tags: [vitest, prisma, dotenv, integration-tests]
---

# Vitest: DATABASE_URL Not Loaded When Running Tests

## Problem

Integration tests that use the real Prisma client (e.g. `tests/unit/db/prospect-queue-schema.test.ts`) fail immediately with:

```
Error: DATABASE_URL is required to initialise Prisma
 ❯ prismaClientSingleton lib/db/prisma.ts:26:11
```

The database and `.env` exist; the test process simply does not have `DATABASE_URL` in `process.env` when Prisma is first imported.

## Environment

- Module: Testing Stack
- Affected: Vitest test runs that use `lib/db/prisma`
- Key files: `vitest.config.ts`, `tests/setup.ts`, `lib/db/prisma.ts`
- Date: 2026-03-16

## Symptoms

- `bun run test` fails for any test file that imports Prisma
- Error occurs at import time, before any test runs
- `process.env.DATABASE_URL` is undefined when `prismaClientSingleton()` executes
- Next.js dev/build load `.env` correctly; only Vitest is affected

## Root Cause

Vitest runs in a separate process. It does not automatically load `.env` from the project root. When a test file imports `@/lib/db/prisma`, the Prisma module runs and checks `process.env.DATABASE_URL`—which is still undefined because `.env` was never loaded.

Bun loads `.env` for the main process, but Vitest may spawn workers that do not inherit the same environment, or the config is evaluated before any env loading occurs.

## What Didn't Work

**Attempted: Rely on Bun's automatic .env loading**
- **Why it failed:** Vitest runs as a child process; env loading in the parent may not propagate to workers.

**Attempted: Add `import "dotenv/config"` to `tests/setup.ts`**
- **Why it was insufficient:** Setup runs after the config; some modules (including Prisma) may be imported when the config is first evaluated, before setup executes.

## Solution

Load `.env` as early as possible by importing `dotenv/config` at the top of `vitest.config.ts`, before any other imports:

```ts
// vitest.config.ts
import "dotenv/config";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // ...
});
```

This ensures `process.env` is populated before Vitest evaluates the config and before any test file (or its transitive imports) loads Prisma.

## Why This Works

The Vitest config file is the first module evaluated when Vitest starts. By importing `dotenv/config` at the very top, Node loads and parses `.env` into `process.env` before any other code runs. When test files later import Prisma, `process.env.DATABASE_URL` is already set.

## Prevention

- Add `import "dotenv/config"` to `vitest.config.ts` whenever tests need env vars (Prisma, API keys, etc.).
- Do not assume Bun or Next.js env loading applies to Vitest; it runs in a separate process.
- If integration tests fail with "DATABASE_URL is required", check that dotenv runs before Prisma is imported.

## Verification

```bash
bun run test -- tests/unit/db/prospect-queue-schema.test.ts
```

Tests that use the real Prisma client should pass when `DATABASE_URL` is set in `.env`.

## Related Issues

- [prisma-config-env-dot-notation-lint.md](../build-errors/prisma-config-env-dot-notation-lint.md) — env access style in Prisma config
- [critical-patterns.md](../patterns/critical-patterns.md) — promoted to Required Reading (Pattern 1)
- `.cursor/skills/regression-sentinel/references/test-setup.md` — added to regression-sentinel skill
- `.cursor/skills/vitest-env-setup/` — extracted into new learning skill
- `.cursor/skills/solution-to-skill/` — extraction workflow used when creating vitest-env-setup
