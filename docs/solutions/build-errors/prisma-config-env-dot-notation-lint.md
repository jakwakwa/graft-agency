---
title: "Prisma config env access lint warning"
date: "2026-03-16"
category: "build-errors"
tags:
  - "prisma"
  - "biome"
  - "lint"
  - "typescript"
severity: "low"
status: "solved"
components:
  - "Prisma configuration"
  - "Environment variable access"
related_files:
  - "prisma.config.ts"
  - "lib/db/prisma.ts"
  - "README.md"
---

# Prisma config env access lint warning

## Symptom

Biome reported this warning in `prisma.config.ts`:

`The computed expression can be simplified without the use of a string literal.`

## Root Cause

The config used bracket notation with a string literal for a valid identifier key:

`process.env["DATABASE_URL"]`

While functionally correct, Biome flags this as unnecessary when dot notation is available.

## Working Fix

Updated the env access to dot notation:

- Before: `process.env["DATABASE_URL"]`
- After: `process.env.DATABASE_URL`

## Verification

- `ReadLints` on `prisma.config.ts` returned no diagnostics.
- The fix is localised and does not change runtime behaviour.

## Prevention

- Prefer dot notation for env keys that are valid identifiers.
- Keep config files typed and minimal (`defineConfig`, explicit config shapes).
- Run both checks before commit:
  - `bun run lint`
  - `bun run build`

## Related Notes

- No existing `docs/solutions` entries were found to cross-link at time of writing.
