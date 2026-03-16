---
name: vitest-env-setup
description: Ensures environment variables load when running Vitest tests. Use when tests fail with "DATABASE_URL is required to initialise Prisma" or when integration tests need env vars (Prisma, API keys) but process.env is empty.
---

# Vitest Environment Setup

## Trigger

Use this skill when:

- Vitest tests fail at import time with `Error: DATABASE_URL is required to initialise Prisma`
- Integration tests that use Prisma, Resend, or other env-dependent code fail before any test runs
- `process.env` is undefined or empty when the test process starts, even though `.env` exists

## Workflow

1. **Confirm the symptom** – Error occurs at import time, not during test execution. Prisma or another module checks `process.env.DATABASE_URL` (or similar) and throws.

2. **Apply the fix** – Add `import "dotenv/config"` as the first line of `vitest.config.ts`. See `references/patterns.md`.

3. **Verify** – Run the failing test again. It should proceed past import and execute.

## Root Cause

Vitest runs in a separate process and does not load `.env` automatically. Bun and Next.js load `.env` for their processes, but Vitest workers do not inherit that. The config file is evaluated first; importing `dotenv/config` there populates `process.env` before any test file loads.

## What Does Not Work

- **Relying on `tests/setup.ts`** – Setup runs after the config; Prisma may be imported when the config is evaluated, before setup executes.
- **Assuming Bun loads .env for children** – Vitest workers may not inherit the parent's env.

## Related

- Solution doc: `docs/solutions/integration-issues/vitest-database-url-not-loaded-testing-20260316.md`
- Critical pattern: `docs/solutions/patterns/critical-patterns.md` (Pattern 1)
- Regression-sentinel prerequisite: `.cursor/skills/regression-sentinel/references/test-setup.md`
