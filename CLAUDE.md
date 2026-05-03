# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Runtime: Bun First

Default to Bun instead of Node.js for all operations.

- `bun <file>` instead of `node <file>` or `ts-node <file>`
- `bun install` instead of npm/yarn/pnpm
- `bun run <script>` instead of npm/yarn/pnpm run
- `bunx <package>` instead of npx
- Bun auto-loads `.env` — never use `dotenv`

**Prefer Bun APIs over npm equivalents:**
- `bun:sqlite` not `better-sqlite3`
- `Bun.redis` not `ioredis`
- `Bun.sql` not `pg` / `postgres.js`
- `Bun.file` not `node:fs` readFile/writeFile
- `Bun.$\`cmd\`` not `execa`
- `WebSocket` is built-in — not `ws`

## Commands

```bash
# Development
bun run dev                   # Next.js dev server
bun run dev:tunnel            # Dev + Pinggy tunnel (for webhooks)

# Build
bun run build                 # prisma generate + next build

# Code quality
bun run lint                  # Biome check
bun run format                # Biome format --write

# Testing
bun run test                  # Vitest unit tests (run once)
bun run test:watch            # Vitest watch mode
bun run test:e2e              # Playwright E2E (Chromium)
bun run test:all              # Unit + E2E

# Database
bun run db:migrate:dev        # Create new Prisma migration
bun run db:migrate:deploy     # Run migrations in prod
bun run db:migrate:status     # Check migration status
bun run db:seed               # Run prisma/seed.ts

# Inngest (run separately)
inngest dev                   # Local Inngest dev server
```

Run `bun run build` (not just IDE type-checks) to catch compile-time contract errors — several TypeScript/Prisma bugs only surface there.

## Architecture Overview

**GRAFT.TODAY** is a multi-tenant AI agency SaaS. Each tenant (Client) gets their own GraftBot chatbot widget and access to an automated outbound prospecting + engagement pipeline.

### Multi-Tenancy Model

- **Clerk Organizations** map 1:1 to **Client** records in Prisma
- `lib/auth/resolve-client.ts` maps `Clerk userId → clientId`
- Platform owner (`isPlatformOwner`) and resellers (`isReseller`) have elevated access
- All data-access must scope queries by `clientId` — enforce at service layer

### Core Pipelines

**1. Prospecting Pipeline** (`lib/inngest/functions/prospecting-tick.ts`)
Triggered by cron or manually: scrapes websites → Google Gemini audit (AI presence, pain points) → generates personalized cold email drafts → enters approval queue before dispatch.

**2. Engagement Pipeline** (`lib/inngest/functions/`)
Full solution delivery for approved leads via 8 Inngest functions chained by events:
`lead-profiler` → `prd-writer` → `stitch-designer` → `jules-builder` → `jules-poller` → `engagement-reconciler` → `offer-dispatcher`

Each stage writes to `ProductSpec.stage` (enum `EngagementStage`). Reconciler handles retries and failures. Dry-run mode stubs Vercel/Paddle/Resend calls (`ENGAGEMENT_DRY_RUN=true`).

**3. Chat/Widget** (`app/api/chat/`, `app/widget/`, `lib/ai/`)
Tenant-embedded iframe chatbot streaming via Vercel AI SDK. Model router selects Google Gemini or Claude. Tools: `capture-lead`, `book-appointment`, `check-availability`, `handoff-human`, `search-knowledge`.

### Key Directories

- `app/api/` — Route handlers (chat, leads, webhooks, billing, engagement, inngest)
- `app/(portal)/` — Authenticated tenant portal (billing, conversations, settings, embed)
- `lib/services/` — Business logic layer (agent, lead, conversation, email, prospecting)
- `lib/inngest/functions/` — All 8 engagement pipeline Inngest functions
- `lib/ai/tools/` — AI tool definitions (one factory per tool, close over `clientId`)
- `lib/auth/` — Clerk→Client resolution and access guards
- `lib/db/prisma.ts` — Prisma singleton (see Prisma pattern below)
- `prisma/schema.prisma` — Source of truth for all models

### Payments

Paddle is the MoR (Merchant of Record) — handles global tax/VAT automatically. Webhook at `app/api/webhooks/paddle/` syncs subscription state to Prisma. Client subscription flags drive feature access.

## TypeScript Rules

**Never use `any`.** No weak workaround types. Fix the underlying type properly.

**Derive event/prop types from the wrapped component** rather than hand-writing DOM types:
```ts
// ✅
type SelectEvent = Parameters<NonNullable<ComponentProps<typeof DropdownMenuItem>["onSelect"]>>[0];
```

**Prisma singleton** — when the client has multiple init branches (Accelerate vs standard), export one stable type to avoid "not callable" errors:
```ts
type PrismaClientSingleton = PrismaClient;
```

**AI Tools** — build per-request factories that close over `clientId`; don't overload service functions:
```ts
export const createSearchKnowledgeBaseTool = (clientId: string) => tool({ ... })
```

**Prisma → JSON serialization** — use an explicit boundary when persisting SDK payloads:
```ts
JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
```

## API Routes & Server Actions

**Always authenticate inside Server Actions** — they are public endpoints, not protected by middleware alone:
```ts
'use server'
export async function myAction(data: unknown) {
  const session = await verifySession()   // auth check inside, every time
  if (!session) throw unauthorized()
  // validate, then authorize, then mutate
}
```

**Avoid waterfall chains** — start independent operations immediately:
```ts
// ✅ Correct: auth and config start in parallel
const sessionPromise = auth()
const configPromise = fetchConfig()
const session = await sessionPromise
const [config, data] = await Promise.all([configPromise, fetchData(session.user.id)])
```

## Testing

Unit tests use **Vitest** with `jsdom` (`tests/unit/`). E2E uses **Playwright** Chromium (`tests/e2e/`). Tests import from `bun:test` in standalone scripts, but use `vitest` imports inside the `tests/` tree.

Always verify tests actually pass after writing them — don't assume a green IDE means green CI.
