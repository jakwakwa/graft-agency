---
applyTo: "{app/**/*.{ts,tsx,css},components/**/*.{ts,tsx},hooks/**/*.{ts,tsx}}"
---

# Frontend Instructions

Use this file together with [AGENTS.md](../../AGENTS.md) and [docs/living-sop.md](../../docs/living-sop.md). If they conflict, follow the more specific instruction that matches the file you are editing.

## Scope

- Use these rules for App Router UI, shared components, styling, and frontend hooks.
- Do not apply these rules to API handlers, Prisma files, or backend-only services.

## UI Rules

- Reuse existing shared primitives before introducing new patterns.
- Prefer the established Button pattern in [components/ui/button.tsx](../../components/ui/button.tsx).
- Prefer Typography components from [components/ui/typography.tsx](../../components/ui/typography.tsx) for headings, body, lists, and inline code when consistent styling is required.
- Keep components modular. If a component is becoming difficult to scan or reason about, split it before it becomes large.
- Preserve the style already used in the file instead of reformatting it into a different house style.

## App Router Guidance

- Keep route segments and layouts focused on composition.
- Put domain or business logic in hooks or services rather than inside page components.
- Treat `app/[domain]/` as incomplete multi-tenant groundwork. Do not assume tenant resolution already exists.
- Treat `app/widget/` work as routing-sensitive UI that may need Playwright verification.

## Styling And Copy

- Use Tailwind utility classes and existing UI primitives rather than bespoke CSS unless there is a clear need.
- Keep user-facing copy in UK English.
- Avoid raw heading and paragraph tags when the shared Typography primitives are the established pattern.

## Verification

- When editing already-covered shared UI files, run the smallest relevant Vitest test immediately.
- Run `bun run lint` after meaningful TypeScript, React, or shared UI changes.
- Run `bun run build` when frontend changes affect routing, layouts, typed props, or configuration.
