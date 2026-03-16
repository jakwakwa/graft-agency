# Kona Agency: Living Engineering SOP

## 1. Document Purpose and Scope

This file is the canonical grounding document for the Kona Agency codebase. It merges:

- Architecture vision and target state
- Enforced engineering rules and completion gates
- Current implementation state (ground truth)

**Who updates it:** Any engineer or agent who changes schema, API surface, middleware, test strategy, or deployment workflows. Update this document whenever the "Implementation Status Matrix" or "Data Layer Canonical Spec" changes.

**Why it exists:** To prevent drift between rules, vision, and reality. New work must reference this SOP for correctness and completion criteria.

---

## 2. Current Architecture Baseline (Truth Today)

### 2.1 Data Layer

| File | Status |
|------|--------|
| `prisma/schema.prisma` | Implemented. Six models: `Client`, `AgentConfig`, `Lead`, `ProspectQueue`, `EmailTemplate`, `Conversation`. UUID PKs, JSONB for AI fields, `onDelete: Cascade` where applicable. |
| `prisma.config.ts` | Implemented. Prisma v7 config; datasource URL via `process.env.DATABASE_URL`. |
| `lib/db/prisma.ts` | Implemented. Prisma v7 client singleton with three modes: direct PG adapter (`DIRECT_DATABASE_URL`), standard PG adapter (`DATABASE_URL`), and Accelerate (`prisma://` or `prisma+postgres://`). |
| `generated/prisma/` | Generated. Prisma client output path. |

### 2.2 Routing and Middleware

| File | Status |
|------|--------|
| `proxy.ts` | Implemented. Clerk middleware only. No tenant/subdomain rewrite logic. Next.js expects `middleware.ts` at root—`proxy.ts` may need renaming for activation. |
| `app/[domain]/` | Implemented. Placeholder tenant route segment. No tenant resolution from subdomain. |
| `app/(marketing)/` | Implemented. Placeholder marketing layout and dashboard shell. |

### 2.3 API and Services

| Area | Status |
|------|--------|
| `app/api/` | Partially implemented. `app/api/chat/route.ts` streams AI responses and persists conversations; embed route exists; webhooks and cron handlers are still missing. |
| `lib/services/` | Partially implemented. Initial `agent`, `conversation`, `lead`, and `cal` services exist; outbound and production-hardening work remains. |

### 2.4 Tests

| Area | Status |
|------|--------|
| `tests/components/ui/` | Implemented. `button.test.tsx`, `typography.test.tsx` (Vitest + RTL). |
| `tests/setup.ts` | Implemented. |
| E2E / Playwright | Implemented (initial). `tests/e2e/widget-chat.spec.ts` covers the widget flow. |
| Service / business logic tests | Implemented (initial). Unit coverage exists for AI tools and service modules. |

---

## 3. Target Architecture (North Star)

### 3.1 Core Stack

- **Framework:** Next.js App Router (multi-tenant routes + API handlers)
- **Database:** PostgreSQL
- **ORM:** Prisma v7 (ESM, generated client output, Prisma config)
- **Validation:** Zod for strict tool contracts
- **AI runtime:** Vercel AI SDK (`streamText`, `generateObject`)
- **Auth & tenancy:** Clerk Organisations for tenant identity
- **Infra:** Vercel Edge + Cron jobs

### 3.2 Architectural Pillars

**1. Inbound Agent (Conversational Lead Capture)**

- Chat interface: React component using `useChat` for streaming.
- Route brain: `app/api/chat/route.ts` with `streamText`.
- Tooling model: Zod-typed tools (e.g. `captureLeadDetails`, booking tools).
- Outcome: Visitor intent captured, persisted to `Lead`, then routed to booking flow.

**2. Deep Scheduling Layer (Cal.com API v2)**

- Use Cal.com API instead of a simple embed for full control.
- Provision users/event types during client onboarding.
- Consume booking/cancellation webhooks to keep lead state accurate.
- Build a white-labelled scheduling UI in-app.

**3. Outbound Prospector (Programmatic Acquisition)**

- Cron/server workflow ingests local business websites.
- Scraped content audited with `generateObject` + strict Zod schema.
- If no AI capability detected, draft personalised outreach and store for review.
- Queue status and retries tracked in `ProspectQueue`.

---

## 4. Mandatory Engineering Rules (Operational Guardrails)

### 4.1 Core Philosophy (Kona Project Governance)

1. **Truth First:** Never say a task is complete until you have verified the file changes. No "should work" or "mocking" unless explicitly asked.
2. **Modular Integrity:** No component exceeds 150 lines. If it does, extract sub-components or logic hooks immediately.
3. **No Assumptions:** As per user requirement: No guessing. If a variable or API response is unknown, ask the user or look at the types/docs.
4. **UK English:** All UI text and comments must use UK English (e.g. "optimise", "colour").

### 4.2 Technical Constraints

- **Stack:** Next.js 14+ (App Router), TypeScript (Strict), Prisma, Tailwind CSS, Shadcn/UI, Base UI.
- **Server Actions:** Separate business logic from actions. Actions call Services (e.g. `lib/services/email.service.ts`).
- **Data Safety:** Every database write must be wrapped in a try/catch with proper logging.
- **Tooling:** Use Bun commands and scripts only (not npm, npx, or bunx).

### 4.3 Completion Definition

A task is NOT complete until:

- Types are verified (no `any`).
- File structure follows the modular plan.
- The user is told EXACTLY what files were changed and what logic was added.
- Relevant tests pass and runtime/compile-time verification has been performed.

### 4.4 Testing Governance

- Treat automated tests as the source of truth. If relevant tests do not exist or do not pass, the work is not complete.
- Every new service, server action, or business-logic module must ship with a corresponding `.test.ts` file.
- Use Vitest for business logic and integration coverage.
- Use Playwright for critical flows (tenant onboarding, outbound dispatch, subdomain routing).
- Never make real third-party API calls in unit tests. Mock Resend, Cal.com, OpenAI, and similar boundaries.
- When editing code that already has automated coverage, use the regression-sentinel skill and get back to green before moving on.

### 4.5 UI and Styling

- Use Tailwind only. Use Shadcn for complex Radix-based components. Keep logic in a separate `use-feature.ts` hook.
- Use Typography components from `@/components/ui/typography` for headings, body, and inline text (see `.cursor/rules/typography-components.mdc` for mapping).

---

## 5. Data Layer Canonical Spec

### 5.1 Models

| Model | Purpose |
|-------|---------|
| `Client` | Multi-tenant identity. `clerkOrganizationId` for auth resolution. `subdomain` for routing. |
| `AgentConfig` | 1:1 with Client. AI branding; system prompt, knowledge base, widget colour. |
| `Lead` | Captured and prospective customers. Inbound or outbound source. |
| `ProspectQueue` | Feeding trough for outbound cron. Tracks status, attempts, errors. |
| `EmailTemplate` | Per-client or agency-level outbound templates. |

### 5.2 Enums

- `LeadSource`: `INBOUND`, `OUTBOUND_PROSPECT`
- `LeadStatus`: `SCRAPED`, `DRAFT_PENDING`, `CONTACTED`, `REPLIED`, `BOOKED`, `CLOSED`
- `QueueStatus`: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`

### 5.3 Relation Semantics

- `AgentConfig` → `Client`: `onDelete: Cascade`
- `Lead` → `Client`: `onDelete: Cascade`
- `EmailTemplate` → `Client`: `onDelete: SetNull` (preserve templates on tenant churn)

### 5.4 JSONB Fields (AI Search-Ready)

- `Lead.chatTranscript`
- `Lead.scrapedData`
- `AgentConfig.knowledgeBase`
- `Conversation.messages`

### 5.5 Indexes

- `Client`: `@@index([subdomain])`
- `Lead`: `@@index([clientId, status])`, `@@index([status])`
- `ProspectQueue`: `@@index([status])`
- `EmailTemplate`: `@@index([clientId, isDefault])`

---

## 6. Implementation Status Matrix

| Capability | Status | Notes |
|------------|--------|-------|
| Prisma v7 schema | Implemented | Migrations applied. |
| Prisma client singleton | Implemented | Adapter + Accelerate support. |
| Clerk auth | Implemented | Middleware in `proxy.ts`. |
| Tenant subdomain routing | Not Implemented | No rewrite logic in middleware. |
| Inbound chat API | Implemented (initial) | `app/api/chat/route.ts` streams model output, scopes tools per client, and persists conversations. |
| Inbound chat UI | Implemented (initial) | Widget route uses `useChat`, persists session state, and posts to `/api/chat`. |
| Cal.com integration | Not Implemented | No provisioning, webhooks, or UI. |
| Outbound prospector | Not Implemented | No cron, queue processor, or outreach drafting. |
| Service layer | Implemented (initial) | `agent`, `conversation`, `lead`, and `cal` services exist, but still need broader hardening. |
| Domain/business logic tests | Implemented (initial) | Unit tests cover current AI/service contracts. |
| E2E / Playwright specs | Implemented (initial) | Widget chat Playwright coverage exists. |

---

## 7. Execution SOP for New Work

### 7.1 Required Sequence

1. **Schema first** (if data changes): Update `prisma/schema.prisma` → `bun prisma migrate dev --name <descriptive>` → `bun prisma generate`.
2. **Service layer** (if business logic): `lib/services/<domain>.service.ts` with `.test.ts` alongside.
3. **API / route handlers** (if needed): `app/api/...` calling services.
4. **Tests**: Vitest for logic; Playwright for flows that touch routing, tenant resolution, or critical UX.
5. **Verification**: Run `bun run test`, `bun run test:e2e` (where applicable), `bun run build`.

### 7.2 Verification Commands

```bash
bun run test        # Vitest
bun run test:e2e    # Playwright
bun run build       # Compile-time verification
bun run lint        # Biome
```

### 7.3 Test-Driven Feature Workflow (Default)

1. Blueprint: list planned files and the exact Vitest and Playwright cases.
2. Contract: write TypeScript interfaces and a failing Vitest test.
3. Implementation: write the minimum code to make the test pass.
4. E2E scripting: write or update the Playwright test for the affected flow.
5. Final audit: run targeted tests, then broader suite, then summarise.

### 7.4 Gold Rush Feature Pipeline (When Invoked)

When the user says "Execute the Feature Workflow for X", the Gold Rush pipeline applies. It is a 5-step gated workflow with user approval at key phases. TDD steps run inside each phase. See `.cursor/rules/gold-rush-feature-workflow.mdc` for full details.

---

## 8. Change Control and Update Cadence

### 8.1 Update Triggers

Update this document whenever:

- Schema/model or migration changes
- New API route/service for inbound, outbound, or scheduling
- Middleware/tenant-routing changes
- Test strategy or command changes
- Deployment or environment process changes

### 8.2 Update Block

After each substantive edit, update the block below:

---

**Last updated:** 2026-03-16  
**Updated by:** Cursor agent  
**What changed:** Recorded the initial inbound chat stack as implemented: chat API routing, request-scoped AI tools, conversation persistence, widget UI flow, and accompanying unit/E2E coverage.  
**Verification performed:** `bun run test -- tests/unit/services/agent.service.test.ts tests/unit/services/conversation.service.test.ts tests/unit/ai/tools/search-knowledge.test.ts tests/unit/api/chat.route.test.ts`, `bun run lint`, `bun run build`, and a local browser smoke test of `/widget/test-client-e2e` on the dev server.

---

## 9. Open Gaps and Next Priorities

1. **Middleware tenant routing** (high): Wire subdomain → `Client` resolution. Consider renaming `proxy.ts` to `middleware.ts` if needed for Next.js activation.
2. **Chat hardening** (high): Add auth/client validation, richer error handling, and production-safe persistence around the inbound chat route.
3. **Cal.com integration** (medium): Provisioning, webhooks, and white-labelled scheduling UI.
4. **Outbound prospector** (medium): Cron handler, queue processor, `generateObject` audit, outreach drafting.
5. **E2E coverage** (medium): Expand Playwright beyond the widget happy path into tenant routing and failure modes.
6. **Service hardening** (medium): Broaden service validation, logging, and transaction boundaries as the domain grows.
7. **GAPS.md** (low): Maintain after each feature session per governance rule.
