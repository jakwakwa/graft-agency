---
name: regression-sentinel
description: Runs the smallest relevant automated test immediately after edits to already-covered code and blocks further work until the test is green. Use when editing files that already have matching .test.ts, .spec.ts, or Playwright coverage during refactors, bug fixes, or UI changes.
---

# Regression Sentinel

## Trigger

Use this skill whenever:

- an edited file already has a colocated or clearly associated `.test.ts`, `.test.tsx`, `.spec.ts`, or `.spec.tsx`
- an edited route, page, widget, or tenant flow is already covered by Playwright
- a cleanup or refactor could silently break behavior that is already tested

## Workflow

1. Locate the closest existing automated tests before or immediately after the edit.
2. Run the narrowest relevant check first using Bun-native commands.
3. If that check fails, stop and fix the regression before continuing.
4. Do not move to unrelated work while the sentinel is red.
5. Before final handoff, report which tests were run and whether they are green.

## Test Selection

- Colocated unit test: run that file first.
- Service or server action: run the matching Vitest file.
- Page, widget, or routing change: run the matching Playwright spec.
- If the mapping is ambiguous, start with the smallest likely subset and widen only if needed.

## Command Defaults

- `bun run test -- <path>` when the project exposes file-filtered Vitest scripts
- `bun run vitest --run <path>` when direct tool invocation is needed
- `bun run test:e2e -- <path>` or `bun run playwright test <path>` for Playwright
- `bun run build` when the change also needs compile-time verification

## Prerequisites (Test Environment)

If tests fail at import time with `DATABASE_URL is required to initialise Prisma`, the test process is not loading `.env`. Apply the fix in `references/test-setup.md` (add `import "dotenv/config"` to `vitest.config.ts`) before running the sentinel.

## Guardrails

- Never claim a change is safe because it "looks right."
- Never skip an existing relevant test to save time.
- If no relevant automated test exists, say so explicitly and add one before calling the work complete when the task warrants it.
