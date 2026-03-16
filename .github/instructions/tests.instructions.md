---
applyTo: "{tests/**/*.{ts,tsx},**/*.{test,spec}.{ts,tsx}}"
---

# Test Instructions

Use this file together with [AGENTS.md](../../AGENTS.md) and [vision.md](../../vision.md). These rules define how to choose the right test level and when work can be considered verified.

## Test Selection

- Use Vitest for unit and integration coverage of business logic, utilities, and component behaviour.
- Use Playwright for flows involving routing, multi-tenant behaviour, iframe widgets, or critical end-to-end interactions.
- If you touch code that already has tests, run the smallest relevant existing test immediately before moving on.

## Test Writing

- Follow the current test style in [tests/components/ui/button.test.tsx](../../tests/components/ui/button.test.tsx) and [tests/components/ui/typography.test.tsx](../../tests/components/ui/typography.test.tsx).
- Keep tests focused on observable behaviour rather than implementation details.
- Mock third-party boundaries in unit tests instead of making real external calls.
- Add coverage for new service or business-logic modules; do not leave new core logic untested.

## Verification Commands

- Use `bun run test` for the Vitest suite.
- Use `bun run test:e2e` for Playwright coverage.
- Use `bun run build` when a change can affect compile-time or framework behaviour.

## Completion Gate

- Do not claim work is complete until relevant tests pass.
- If relevant coverage does not exist yet, add it or explicitly call out the gap.
- If changes affect schema, middleware, API surface, services, or test strategy, update [vision.md](../../vision.md) so the SOP stays aligned with reality.