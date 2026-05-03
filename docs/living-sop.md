# Graft AI Web Solutions — Living SOP

**Owner:** Jaco Kotzee | **Last Updated:** 2026-05-01 | **Review Cadence:** Monthly

---

## Purpose

This document is the single source of truth for how the Graft platform operates — from architecture and auth through to billing, the AI engagement pipeline, and day-to-day development. It is derived from the codebase, not aspirational planning docs.

## Scope

Covers: platform architecture, auth & multi-tenancy, AI chatbot system, outbound prospecting engine, engagement pipeline (lead → deployed website → paid offer), billing via Paddle, webhook integrations, development workflow, and testing.

Does not cover: marketing copy, sales playbooks, or customer-facing help docs.

---

## 1. Architecture Overview

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | Deployed on Vercel |
| Runtime | Bun | All scripts, tests, and local dev use Bun |
| Database | PostgreSQL (Neon) | Prisma 7 ORM, generated client at `generated/prisma/` |
| Auth | Clerk | Org-based multi-tenancy, Svix webhook verification |
| AI | Gemini (via Vercel AI SDK + `@google/genai`) | `gemini-3-flash-preview` for simple tasks, `gemini-3.1-pro-preview` for complex |
| Billing | Paddle | Merchant of Record — subscriptions, add-ons, one-time transactions |
| Scheduling | Cal.com v2 API | Headless booking — availability checks and booking creation |
| Email | Resend | Outreach and offer dispatch |
| Background jobs | Inngest | 9 functions, event-driven with cron triggers |
| Design generation | Google Stitch SDK | 3 design concepts per engagement |
| Code generation | Jules (Google) | AI coding sessions from PRD + design spec |
| Hosting (prospects) | Render | One static site per prospect, deployed from PR branch |
| Tunnel (dev) | Pinggy | Local HTTPS tunnel for webhook testing |

### Key directories

```
app/                    Next.js App Router pages and API routes
├── (marketing)/        Dashboard and public pages (requires Clerk auth)
├── (portal)/           Tenant portal — billing, conversations, settings, embed
├── widget/[clientId]/  Embeddable chat widget (public, no auth)
└── api/                All API endpoints
lib/
├── ai/tools/           Chatbot tool definitions (Zod-validated)
├── auth/               Clerk auth helpers and client resolution
├── engagement/         Stage machine and pipeline utilities
├── inngest/            Inngest client + 8 function definitions
├── services/           Business logic layer
└── webhooks/           Webhook handler logic (Clerk orgs, etc.)
scripts/                Dev tooling — tunnel, seed, provisioning
prisma/                 Schema, migrations, seed
tests/                  Unit (Vitest) and E2E (Playwright)
```

---

## 2. Authentication & Multi-Tenancy

### Roles

| Role | DB flags | Access |
|---|---|---|
| Platform Owner | `isPlatformOwner: true` | Full dashboard — chatbot config, automation, prospecting, members |
| Reseller | `isReseller: true` | Dashboard access — automation, prospecting, scoped to own data |
| Regular Member | Both `false` | Portal only — billing, conversations, embed code, bot settings |

### Auth flow

1. User signs in via Clerk.
2. Clerk middleware (`proxy.ts`) protects all routes except explicitly public ones (`/`, `/privacy`, `/terms`, `/api/chat`, `/api/embed/*`, `/api/webhooks/*`, `/api/cron/*`, `/api/inngest`, `/widget/*`).
3. `resolveClientIdFromAuth()` maps `clerkUserId` → `Client.id`. If no row exists for an org member, it auto-provisions one via `provisionClientFromPlatformMembership()`.
4. Dashboard routes call `requirePlatformAccess()` (gates on `isPlatformOwner || isReseller`).
5. Portal routes use `resolveClientIdFromAuth()` directly — any authenticated client can access their portal.

### Client provisioning

- **Webhook-driven**: `organizationMembership.created` → Clerk webhook → upserts `Client` row keyed by `clerkUserId` → creates Paddle customer.
- **Login recovery**: If a member was invited but the webhook was missed, `resolveClientIdFromAuth()` detects platform org membership and provisions on-the-fly.
- **Soft delete**: `organizationMembership.deleted` → sets `deletedAt` on the Client row. `organization.deleted` → soft-deletes all clients in that org.
- **Bootstrap (dev only)**: When `CLERK_WEBHOOK_BOOTSTRAP_PLATFORM=true`, the first `organization.created` event auto-creates the platform owner client.

### Reseller provisioning

Manual via CLI:
```bash
bun scripts/provision-reseller.ts <clerkOrgId> <businessName>
```

---

## 3. AI Chatbot System

### How it works

The chatbot is a Gemini-powered conversational agent that uses deterministic tool calling (Zod-validated) to perform structured actions. Each client gets their own agent configuration.

### Tools

| Tool | Purpose | Key params |
|---|---|---|
| `captureLeadDetails` | Saves visitor info as an INBOUND lead | `name`, `email?`, `phone?`, `need?` |
| `checkAvailability` | Queries Cal.com for open time slots | `username?`, `eventTypeSlug?`, `dateRange?`, `timeZone?` |
| `bookAppointment` | Books a confirmed Cal.com appointment | `start` (ISO), `name`, `email`, `timeZone?`, `notes?`, `leadId?` |
| `searchKnowledgeBase` | Searches client's JSON knowledge base | `query` |
| `handoffToHuman` | Flags conversation for human review | `reason`, `urgency` (low/medium/high) |

### Model routing

- If only `searchKnowledgeBase` is available → `gemini-3-flash-preview` (faster, cheaper).
- Otherwise → `gemini-3.1-pro-preview`. Max 5 tool-use steps per turn.

### Embedding

Clients embed the chatbot via an iframe. The snippet is available at:
- Portal: `/portal/embed` — copy-paste guide
- API: `GET /api/embed/[clientId]` — returns the JavaScript loader

The widget page itself (`/widget/[clientId]`) is a public route. It mints a short-lived signed widget token using `WIDGET_TOKEN_SECRET`, scoped to the client and embedding origin, then calls `POST /api/chat`. The chat route verifies the token, checks `Client.allowedDomains`, subscription status, and a database-backed usage quota before model selection or streaming. The `clientId=platform` landing demo remains the only no-token exception.

### Agent configuration

Managed via `/portal/settings`. Stored in the `AgentConfig` table:
- `systemPrompt` — custom system instructions
- `knowledgeBase` — JSON Q&A entries searchable by the bot
- `agentName`, `greetingMessage` — bot personality
- `widgetPrimaryColour` — brand color
- `calComUsername`, `defaultEventSlug` — Cal.com booking defaults

---

## 4. Outbound Prospecting Engine

### Purpose

Automatically discovers businesses without AI chatbots and generates hyper-contextualized outreach drafts.

### Pipeline

```
ProspectingConfig (cron settings)
  → Gemini two-pass search (find → audit)
    → HTTP reachability check + LLM judge verification
      → CRM deduplication
        → Lead created (SCRAPED status, OUTBOUND_PROSPECT source)
```

### Trigger mechanisms

1. **Inngest cron** — `prospecting-scheduled-tick` fires every 15 minutes, checks the `ProspectingConfig` (enabled? right day? right time? duplicate run guard?) and runs if due.
2. **Manual** — `POST /api/automation/find-prospects` triggers an immediate run.
3. **Vercel cron** — Currently empty (`vercel.json: { crons: [] }`). All scheduling is via Inngest.

### Configuration

Managed via `/dashboard/automation` → prospecting config UI → `GET/POST /api/prospecting-config`.

| Field | Purpose |
|---|---|
| `cronEnabled` | Master on/off |
| `searchEnabled` | Allow automated search |
| `searchCriteria` | JSON — industry, location, keywords |
| `cronFrequency` | `daily` or `weekly` |
| `cronDay` | Day of week (for weekly) |
| `cronTime` | Time of day |
| `cronStartDate` | Don't run before this date |
| `outreachFromEmail` | Reply-to address for outreach |
| `valueProposition` | Injected into Gemini prompt for tailored pitches |

### Prospect queue

Prospects can also be added manually:
- **Single**: `POST /api/prospect-queue` with `businessName` + `websiteUrl`
- **Bulk CSV**: `POST /api/prospect-queue/upload` (max 10,000 rows, 5 MB)

Queue items have status: `PENDING → PROCESSING → COMPLETED/FAILED/CANCELED`.

---

## 5. Engagement Pipeline

The engagement pipeline is the automated sequence that takes an approved outbound lead from raw prospect to deployed website with a paid offer. It is entirely event-driven via Inngest.

### Stage flow

```
PENDING → PROFILING → PROFILED → WRITING_PRD → PRD_WRITTEN
  → DESIGNING → DESIGN_COMPLETE → BUILDING → BUILDING_COMPLETE
    → DEPLOYING → DEPLOYED → OFFER_SENT
                                        ↘ FAILED (from any stage)
```

### Inngest functions (in execution order)

| # | Function | Trigger event | What it does |
|---|---|---|---|
| 1 | `lead-profiler-agent` | `engagement/lead.approved` | Calls Gemini with Google Search grounding to profile the lead's business needs. Outputs `ProfiledNeeds` JSON. |
| 2 | `prd-writer-agent` | `engagement/lead.profiled` | Calls Gemini Pro to write a Markdown PRD from the profiled needs. |
| 3 | `stitch-designer` | `engagement/prd.written` | Extracts design direction from PRD, calls Google Stitch SDK to generate 3 design concept images. |
| 4 | `jules-builder` | `engagement/design.completed` | Creates a Jules AI coding session with the PRD + chosen design spec. Idempotent via `julesSessionIntentKey`. |
| 5 | `jules-poller` | `engagement/build.started` + `engagement/build.poll.tick` | Polls Jules API every 60s. Auto-approves plans. On completion: resolves PR URL, provisions Render service, resolves deployment URL. |
| 6 | `offer-dispatcher` | `engagement/deployment.ready` | Creates Paddle transaction (£497 landing / £997 SMB). Sends HTML offer email via Resend. Updates lead status to CONTACTED. |

### Supporting infrastructure

| Component | Purpose |
|---|---|
| `engagement-reconciler` | Cron (every 15 min) + on-demand. Detects stale stages, queries external APIs (Jules, Render), promotes or fails. Processes up to 50 leads per cron tick. |
| `process-webhook-receipt` | Processes verified webhook receipts asynchronously after route-level signature verification and receipt persistence. |
| `stage-machine.ts` | Atomic transitions with optimistic locking (`stageVersion`). Writes `StageTransition` audit rows. Validates allowed transitions. |
| `on-failure.ts` | Shared Inngest failure handler. Records failure metadata on ProductSpec, fires `engagement/reconcile.requested`. |
| `ENGAGEMENT_DRY_RUN` | Env var to stub Paddle/Resend/Vercel side-effects during dev/testing. |

### Triggering the pipeline

1. Review a lead in `/dashboard/automation/leads`
2. Click "Approve" → `POST /api/leads/[id]/approve` — atomically locks the lead row, upserts `ProductSpec`, fires `engagement/lead.approved`
3. Or manually: `POST /api/engagement/trigger/[leadId]`

### Monitoring

- **Status endpoint**: `GET /api/engagement/status/[leadId]` — returns full `ProductSpec` with Jules/Render state. Triggers on-read reconcile if data is stale.
- **Dashboard**: `/dashboard/automation/queue/[id]` — engagement panel with real-time status.

---

## 6. Billing (Paddle)

Paddle is the Merchant of Record — handles global tax/VAT automatically. `PADDLE_ENVIRONMENT` selects the Paddle API environment and defaults to `sandbox`; production Vercel deployments must keep `PADDLE_ENVIRONMENT=sandbox` until Paddle go-live is approved.

### Products & pricing

| Product | Type | Price |
|---|---|---|
| AI Chatbot (monthly) | Subscription | £147/month |
| AI Chatbot (annual) | Subscription | £1,470/year |
| Voice add-on | Subscription add-on | £37/month |
| Booking add-on | Subscription add-on | £27/month |
| Landing page build | One-time transaction | £497 |
| SMB website build | One-time transaction | £997 |

### Subscription flow

1. User opens `/portal/billing` → selects plan → `paddle.Checkout.open()` with `priceId` and `customData: { clientId }`.
2. Paddle processes payment → fires `subscription.activated` webhook.
3. Webhook handler sets `Client.subscriptionActive = true`, saves `paddleSubscriptionId`.

### Add-on management

1. User toggles add-on card in `/portal/billing` → `POST /api/billing/addons` with `{ priceId, action: "add"|"remove" }`.
2. Route modifies subscription items → `paddle.subscriptions.update()` with `prorationBillingMode: "prorated_next_billing_period"`.
3. Paddle fires `subscription.updated` → recalculates `Client.subscriptionAddons` array.

### Customer portal

`GET /api/billing/portal` → creates a Paddle customer portal session → redirects user.

### One-time builds (engagement pipeline)

`offerDispatcherFunction` calls `paddle.transactions.create()` with `customData: { leadId, productSpecId, clientId }`. On `transaction.completed` webhook → ProductSpec is confirmed.

### Paddle customer auto-creation

When a Clerk org membership is created, if the client has no `paddleCustomerId`, one is created immediately via `paddle.customers.create()`.

### Webhook events handled

| Event | Action |
|---|---|
| `subscription.activated` | `subscriptionActive: true`, save `paddleSubscriptionId` |
| `subscription.updated` | Recalculate `subscriptionStatus` + `subscriptionAddons` |
| `subscription.canceled` | `subscriptionActive: false`, clear add-ons |
| `subscription.paused` | `subscriptionActive: false`, `subscriptionStatus: "paused"` |
| `subscription.past_due` | `subscriptionStatus: "past_due"` |
| `transaction.completed` | Update ProductSpec (engagement pipeline confirmation) |
| `transaction.payment_failed` | Log only |

---

## 7. Webhook Integrations

All provider webhook routes verify signatures, persist a `WebhookReceipt`, ACK quickly, and enqueue `webhook/receipt.created` for Inngest processing. Duplicate provider event IDs are receipt-safe and do not enqueue duplicate processing.

### Clerk (`POST /api/webhooks/clerk`)

**Verification:** Svix library with `CLERK_WEBHOOK_SECRET`.

**Subscribed events** (configure in Clerk Dashboard → Webhooks):
- `organization.created` — bootstraps platform client (dev only, when `CLERK_WEBHOOK_BOOTSTRAP_PLATFORM=true`)
- `organization.deleted` — soft-deletes all clients in the org
- `organizationMembership.created` — upserts Client + creates Paddle customer
- `organizationMembership.deleted` — soft-deletes the client

**Webhook URL:** `${WEBHOOK_PUBLIC_BASE_URL}/api/webhooks/clerk`

### Cal.com (`POST /api/webhooks/cal`)

**Verification:** HMAC-SHA256 on `cal-signature` header vs `CAL_WEBHOOK_SECRET`.

**Handled event:**
- `BOOKING_CANCELLED` — finds lead by `calBookingUid`, sets status to `CLOSED`, sets `nextActionDate` to +7 days for follow-up.

### Paddle (`POST /api/webhooks/paddle`)

**Verification:** HMAC-SHA256 using `ts:...;h1:...` signature format with `PADDLE_WEBHOOK_SECRET`.

**Handled events:** See Billing section above.

### Vercel Deploy (`POST /api/webhooks/vercel-deploy`)

**Verification:** HMAC-SHA256 on `x-vercel-signature` header vs `VERCEL_WEBHOOK_SECRET`.

**Handled event:**
- `deployment.ready` — matches `repoName` to `ProductSpec.githubRepo`, sets stage to `DEPLOYED`, saves `deploymentUrl`, fires `engagement/deployment.ready` Inngest event.

### Operations endpoints

- `GET /api/ops/metrics` — platform-owner-only chat usage, webhook lag/failure counts, token totals, and recent operational events.
- `GET /api/ops/webhook-receipts` — platform-owner-only receipt list with provider/status filters.
- `POST /api/ops/webhook-receipts` — platform-owner-only replay for a receipt by `receiptId`.

---

## 8. Database Models

### Core models

| Model | Table | Purpose |
|---|---|---|
| `Client` | `clients` | Tenant record — links to Clerk (userId, orgId), Paddle (customerId, subscriptionId), flags (isPlatformOwner, isReseller) |
| `AgentConfig` | `agent_configs` | 1:1 with Client — bot personality, knowledge base, Cal.com settings, widget color |
| `Lead` | `leads` | Inbound (chat) or outbound (prospecting) lead. Status: SCRAPED → DRAFT_PENDING → CONTACTED → REPLIED → BOOKED → CLOSED |
| `Conversation` | `conversations` | Chat transcript. Links to Client + Lead. Keyed by `sessionId`. |
| `ProspectQueue` | `prospect_queue` | Queue item for outbound processing. Status: PENDING → PROCESSING → COMPLETED/FAILED/CANCELED |
| `ProspectingConfig` | `prospecting_configs` | 1:1 with Client — cron schedule, search criteria, outreach settings |
| `ProductSpec` | `product_specs` | Engagement pipeline state machine. 1:1 with Lead. Tracks stage, PRD, designs, Jules session, Render service, Paddle transaction. Optimistic locking via `stageVersion`. |
| `StageTransition` | `stage_transitions` | Audit trail for ProductSpec stage changes |
| `EmailTemplate` | `email_templates` | Reusable email templates per client |
| `ChatUsage` | `chat_usage` | Chat allow/deny usage rows for quota and spend visibility |
| `OperationalEvent` | `operational_events` | Vendor-neutral operational log for chat, AI usage, webhook, and system events |
| `WebhookReceipt` | `webhook_receipts` | Signature-verified provider webhook payloads with processing status and duplicate guard |

---

## 9. Frontend Routing

### Marketing / Dashboard (`(marketing)` group)

| Path | Purpose |
|---|---|
| `/` | Marketing landing page |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/dashboard` | Dashboard home (requires platform access) |
| `/dashboard/access-required` | Shown when authenticated but no Client row |
| `/dashboard/automation` | Automation hub |
| `/dashboard/automation/leads` | Outbound lead list |
| `/dashboard/automation/members` | Org member management (invite, revoke, remove) |
| `/dashboard/automation/queue` | Prospect queue — pending items |
| `/dashboard/automation/queue/all` | All queue items |
| `/dashboard/automation/queue/preview` | Queue preview |
| `/dashboard/automation/queue/[id]` | Individual queue item + engagement panel |

### Portal (`(portal)` group)

| Path | Purpose |
|---|---|
| `/portal` | Portal home |
| `/portal/billing` | Subscription management (Paddle checkout, add-ons, portal link) |
| `/portal/conversations` | Conversation list |
| `/portal/conversations/[id]` | Conversation detail viewer |
| `/portal/embed` | Integration guide + embed code snippet |
| `/portal/settings` | Bot settings — system prompt, knowledge base, Cal.com config, widget color |

### Widget (public, no auth)

| Path | Purpose |
|---|---|
| `/widget/[clientId]` | Embeddable chat widget, loaded in iframe. Talks to `POST /api/chat`. |

---

## 10. Development Workflow

### Prerequisites

- Bun (runtime, package manager, test runner)
- PostgreSQL (local or Neon)
- Clerk account with org webhooks configured
- Paddle sandbox account
- Cal.com API key
- Google Gemini API key
- Inngest account (or local dev server)

### Getting started

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Fill in all required values

# Run migrations
bun run db:migrate:dev

# Seed database (optional)
bun run db:seed

# Start dev server with Pinggy tunnel (for webhook testing)
bun run dev:tunnel

# Or start Next.js only (no webhooks)
bun run dev:next-only
```

### Available scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `bun run dev` | Next.js dev server |
| `dev:tunnel` | `bun run dev:tunnel` | Next.js + Pinggy tunnel (prints Clerk webhook URL) |
| `dev:next-only` | `bun run dev:next-only` | Next.js only, no tunnel |
| `build` | `bun run build` | Prisma generate + Next.js production build |
| `test` | `bun run test` | Vitest unit tests |
| `test:watch` | `bun run test:watch` | Vitest watch mode |
| `test:e2e` | `bun run test:e2e` | Playwright E2E tests |
| `test:all` | `bun run test:all` | Unit + E2E |
| `lint` | `bun run lint` | Biome check |
| `format` | `bun run format` | Biome format |
| `db:migrate:dev` | `bun run db:migrate:dev` | Create/apply migration |
| `db:migrate:deploy` | `bun run db:migrate:deploy` | Apply migrations (CI/prod) |
| `db:seed` | `bun run db:seed` | Seed database |

### Inngest local development

```bash
# Start Inngest dev server
bun scripts/inngest-dev-serve.ts

# Set in .env:
INNGEST_DEV=http://127.0.0.1:8288
```

The Inngest dev UI shows all registered functions, event history, and step-by-step execution.

---

## 11. Testing

### Unit tests (Vitest)

Config: `vitest.config.ts` — jsdom environment, globals enabled, `tests/setup.ts` for test helpers.

```bash
bun run test                          # Run all unit tests
bun run test tests/unit/auth/         # Run a specific directory
bun run test:watch                    # Watch mode
```

**Test organization:**
- `tests/unit/ai/tools/` — AI tool tests (captureLeadDetails, checkAvailability, bookAppointment, searchKnowledge, handoffHuman)
- `tests/unit/auth/` — Auth resolution tests
- `tests/unit/services/` — Service layer tests (agent, cal, conversation)
- `tests/unit/api/` — API route tests (prospect queue)
- `tests/inngest/` — Inngest function tests (lead profiler, PRD writer)
- `tests/webhooks/` — Webhook handler tests (Vercel deploy)
- `tests/services/` — Service tests (Render, Jules, offer)
- `lib/auth/guards.test.ts` — Auth guard tests
- `lib/utils/engagement-stages.test.ts` — Stage utility tests

### E2E tests (Playwright)

Config: `playwright.config.ts` — Chromium desktop, base URL `http://localhost:3000`.

```bash
bun run test:e2e                      # Run E2E tests
bun run playwright:install            # Install browsers
```

**E2E specs:**
- `tests/e2e/widget-chat.spec.ts` — Chat widget flow
- `tests/e2e/automation-dashboard.spec.ts` — Automation dashboard flow

### Type checking

```bash
bunx tsc --noEmit
```

---

## 12. Environment Variables Reference

### Required (all environments)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLERK_WEBHOOK_SECRET` | Svix signature verification |
| `WIDGET_TOKEN_SECRET` | Signs short-lived tenant widget tokens |
| `PADDLE_API_KEY` | Paddle server-side API key |
| `PADDLE_ENVIRONMENT` | Paddle API environment, currently `sandbox` for all deployments |
| `PADDLE_WEBHOOK_SECRET` | Paddle webhook signature |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Paddle.js client token (browser) |
| `PADDLE_PRODUCT_*` | Product IDs (CHATBOT, VOICE, BOOKING, LANDING, SMB) |
| `PADDLE_PRICE_*` | Price IDs (CHATBOT_MONTHLY, CHATBOT_ANNUAL, VOICE_MONTHLY, BOOKING_MONTHLY, LANDING, SMB) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key |
| `CAL_COM_API_KEY` | Cal.com v2 API key |
| `CAL_API_BASE` | Cal.com API origin, including `/v2` |
| `CAL_SLOTS_API_VERSION` | Cal.com slots and slot reservations API version, currently `2024-09-04` |
| `CAL_BOOKINGS_API_VERSION` | Cal.com bookings API version, currently `2026-02-25` |
| `CAL_EVENT_TYPES_API_VERSION` | Cal.com event type listing API version, currently `2024-06-14` |
| `CAL_WEBHOOK_SECRET` | Cal.com webhook HMAC secret |
| `RESEND_API_KEY` | Resend email API key |
| `GRAFT_INNGEST_EVENT_KEY` | Inngest event key |
| `GRAFT_INNGEST_SIGNING_KEY` | Inngest signing key |
| `CRON_SECRET` | Bearer token for cron endpoints |
| `NEXT_PUBLIC_APP_URL` | Public app base URL |
| `OFFER_FROM_EMAIL` | From address for offer emails |

### Required (engagement pipeline)

| Variable | Purpose |
|---|---|
| `STITCH_API_KEY` | Google Stitch SDK for design generation |
| `GITHUB_TOKEN` | GitHub PAT for Jules PR resolution |
| `JULES_API_KEY` | Jules API authentication |
| `RENDER_API_KEY` | Render deployment provisioning |
| `RENDER_OWNER_ID` | Render workspace ID |
| `VERCEL_WEBHOOK_SECRET` | Vercel deploy webhook signature |
| `GRAFT_WEBHOOK_SECRET` | GitHub Actions webhook shared secret |

### Development only

| Variable | Purpose |
|---|---|
| `SHADOW_DATABASE_URL` | Shadow DB for `prisma migrate dev` |
| `PINGGY_TOKEN` | Pinggy Pro token for persistent tunnel subdomain |
| `WEBHOOK_PUBLIC_BASE_URL` | Tunnel HTTPS origin |
| `CLERK_WEBHOOK_BOOTSTRAP_PLATFORM` | Auto-create platform client on first org |
| `INNGEST_DEV` | Point SDK at local Inngest dev server |
| `ENGAGEMENT_DRY_RUN` | Skip external side-effects in pipeline |

### Optional

| Variable | Purpose |
|---|---|
| `STITCH_PROJECT_ID` | Reuse one Stitch project (dev convenience) |
| `JULES_SOURCE_REPO` | Override default Jules source repo |
| `RENDER_ENVIRONMENT_ID` | Render project environment |
| `PLATFORM_CLIENT_ID` | Override platform client resolution |
| `PLATFORM_CLERK_ORG_ID` | Clerk org ID for platform client resolution |
| `INNGEST_ENV` | Inngest cloud environment name |

---

## 13. Exceptions and Edge Cases

| Scenario | What happens |
|---|---|
| Clerk webhook missed during member invite | `resolveClientIdFromAuth()` detects org membership on next login and provisions the Client row on-the-fly |
| Paddle customer doesn't exist at checkout time | Created automatically during Clerk `organizationMembership.created` webhook processing |
| Jules session creation is retried | Idempotent via `julesSessionIntentKey` (unique constraint) — same lead won't create duplicate sessions |
| Engagement stage stuck (Jules polling, Render provisioning) | `engagement-reconciler` runs every 15 min, queries external APIs, promotes or fails stale ProductSpecs |
| Inngest function fails | Shared `onFailure` handler records failure on ProductSpec, fires reconciler to assess external truth |
| Prospect already in CRM | `geminiProspectingService` deduplicates against existing leads by website URL before inserting |
| Cal.com booking cancelled | Webhook sets lead to CLOSED with +7 day follow-up date |
| Subscription payment past due | Paddle webhook sets `subscriptionStatus: "past_due"` — `subscriptionActive` stays true (grace period) |
| Duplicate prospecting cron runs | Scheduler checks `lastCronRunAt` against frequency before executing |

---

## 14. RACI Matrix

| Process | Responsible | Accountable | Consulted | Informed |
|---|---|---|---|---|
| Platform client provisioning | Clerk webhooks (automated) | Platform Owner | — | New member |
| Outbound prospecting runs | Inngest cron (automated) | Platform Owner | — | — |
| Lead approval → engagement pipeline | Platform Owner / Reseller | Platform Owner | — | Lead (via offer email) |
| Subscription billing | Paddle (automated) | Platform Owner | — | Client |
| Bot configuration | Client (self-service) | Client | — | — |
| Cal.com booking | Visitor (via chatbot) | Client | — | Client (Cal.com notification) |
| Engagement pipeline recovery | Reconciler (automated) | Platform Owner | — | — |
| Database migrations | Developer | Jaco Kotzee | — | — |
| Production deployments | Vercel (automated on push) | Jaco Kotzee | — | — |

---

## 15. Metrics

| Metric | Where to measure | Target |
|---|---|---|
| Inbound leads captured | `Lead` table, `source = INBOUND` | Growing month-over-month |
| Outbound prospects found per run | `geminiProspectingService` return value | 3–5 qualified per batch |
| Engagement pipeline completion rate | `ProductSpec` reaching `OFFER_SENT` / total approved | > 80% |
| Pipeline stage failures | `ProductSpec.failedStage` counts | < 10% of approved leads |
| Reconciler recovery rate | Stale stages promoted by reconciler / total stale | > 90% |
| Subscription churn | Paddle `subscription.canceled` events | < 5% monthly |
| Chat widget availability | `GET /api/chat` uptime | 99.9% |
| Test suite pass rate | `bun run test` | 100% |

---

## Related Documents

- [`CLAUDE.md`](../CLAUDE.md) — Bun-first development conventions and AI coding instructions
- [`.env.example`](../.env.example) — Full environment variable reference with inline docs
- [`app/api/embed/GUIDE.md`](../app/api/embed/GUIDE.md) — Widget embedding guide
- [`prisma/schema.prisma`](../prisma/schema.prisma) — Database schema source of truth

---

## Update Block

**Last Updated:** 2026-05-03

**What changed:** Documented the explicit Paddle environment contract: production Vercel deployments continue using Paddle sandbox until go-live, rather than deriving Paddle mode from `NODE_ENV`. Standardised the Cal.com endpoint-specific API version contract to `CAL_SLOTS_API_VERSION`, `CAL_BOOKINGS_API_VERSION`, and `CAL_EVENT_TYPES_API_VERSION`.

**Verification performed:** Paddle MCP sandbox subscription check, Prisma MCP production client check, `bun run test tests/unit/paddle.test.ts tests/unit/api/billing-portal.route.test.ts`, `bun run test tests/unit/services/cal.service.test.ts tests/unit/ai/tools/check-availability.test.ts tests/unit/ai/tools/book-appointment.test.ts`, `bun run build`, and changed-file Biome check.
