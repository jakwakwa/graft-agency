---
module: E2E Testing
date: 2026-03-16
problem_type: integration_issue
component: playwright
symptoms:
  - "expect(header).toBeVisible() failed with strict mode violation"
  - "locator('header') resolved to 2 elements"
  - "Error: strict mode violation: locator('header') resolved to 2 elements"
root_cause: ambiguous_locator
resolution_type: code_fix
severity: medium
tags: [playwright, e2e, locator, strict-mode, widget]
---

# Playwright: Strict Mode Violation When Multiple Headers on Page

## Problem

The E2E test `displays agent name from AgentConfig` in `tests/e2e/widget-chat.spec.ts` failed with:

```
Error: strict mode violation: locator('header') resolved to 2 elements:
    1) <header class="flex justify-end items-center p-4 gap-4 h-16">…</header> aka getByText('Sign InSign Up')
    2) <header class="flex items-center gap-2 px-4 py-3">…</header> aka getByText('AI Assistant')
```

Playwright's strict mode requires locators to resolve to exactly one element. Using `page.locator("header")` matched both the root layout header (Sign In/Sign Up) and the widget header (AI Assistant).

## Environment

- Module: E2E Testing
- Affected: `tests/e2e/widget-chat.spec.ts`
- Key files: `app/layout.tsx` (root header), `app/widget/[clientId]/_components/chat-widget.tsx` (widget header)
- Date: 2026-03-16

## Symptoms

- `bun run test:e2e` fails on "displays agent name from AgentConfig"
- `expect(header).toBeVisible()` throws strict mode violation
- Two `<header>` elements exist on the page when visiting `/widget/[clientId]`

## Root Cause

The root layout (`app/layout.tsx`) renders a global header (Sign In/Sign Up or UserButton) for all pages. The widget page also has its own header inside the chat widget component. Both are visible when the test navigates to `/widget/test-client-e2e`. The generic locator `page.locator("header")` matched both, violating Playwright's strict mode.

## Solution

Scope the locator to the widget content by using a parent selector. The widget content is inside `<main>`:

```ts
// Before (fails: 2 headers match)
const header = page.locator("header");
await expect(header).toBeVisible();

// After (passes: only widget header inside main)
const widgetHeader = page.locator("main header");
await expect(widgetHeader).toBeVisible();
await expect(widgetHeader).toContainText(/AI Assistant|[A-Z]/);
```

`page.locator("main header")` selects the descendant `header` of `main`, which is unique to the widget page content.

## Prevention

- Use scoped locators when multiple elements match a generic selector (e.g. `header`, `button`, `form`).
- Prefer `page.locator("main header")` over `page.locator("header")` when the widget/page content is inside `<main>`.
- Consider layout structure when writing E2E tests: root layout + page-specific content can create duplicate semantic elements.

## Related

- `docs/solutions/ui-bugs/chat-widget-markdown-links.md` — Chat widget UI fixes; same E2E suite
