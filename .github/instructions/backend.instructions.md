---
applyTo: "{app/api/**/*.{ts,tsx},lib/services/**/*.ts,lib/db/**/*.ts,lib/ai/**/*.ts,prisma/**/*.prisma}"
---

# Backend Instructions

Use this file together with [AGENTS.md](../../AGENTS.md) and [docs/living-sop.md](../../docs/living-sop.md). If they conflict, follow the more specific instruction that matches the file you are editing.

## Scope

- Use these rules for route handlers, business logic, database access, AI tool wiring, and schema-adjacent backend work.
- Treat `lib/services/` as the preferred home for business logic.

## Service And Route Structure

- Keep route handlers thin. Parse input, call services, and shape responses without embedding heavy business logic.
- Put reusable business rules in `lib/services/`.
- Use `lib/db/prisma.ts` as the entry point for Prisma access.
- Do not edit generated Prisma output under `generated/prisma/`.
- Treat current service files and AI prompt files as incomplete unless you have verified their behaviour.

## Data And Safety

- Follow `prisma/schema.prisma` as the source of truth for data modelling.
- Keep validation strict at boundaries, especially for route inputs and tool contracts.
- Prefer explicit types over `any`.
- When changing schema, migrations, middleware, service boundaries, or backend commands, update [docs/living-sop.md](../../docs/living-sop.md) to keep the living SOP accurate.

## Known Repo Constraints

- `app/api/` directories currently exist without implemented route files. Do not assume a finished API surface.
- `proxy.ts` contains Clerk middleware, but tenant resolution is not yet wired and middleware activation may require `middleware.ts`.
- `lib/ai/prompts.ts` and the service stubs are placeholders, not production examples.

## Verification

- Add or update Vitest coverage for new business logic.
- Run the smallest relevant test first, then expand verification if the change has wider impact.
- Run `bun run lint` after TypeScript changes.
- Run `bun run build` when backend work affects types, routing, Prisma usage, configuration, or framework integration.
