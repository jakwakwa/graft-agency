# Gold Rush Engine: Updated Architecture Vision

## Core Stack (Current Direction)

- **Framework:** Next.js App Router (multi-tenant routes + API handlers)
- **Database:** PostgreSQL
- **ORM:** Prisma v7 (ESM, generated client output, Prisma config)
- **Validation:** Zod for strict tool contracts
- **AI runtime:** Vercel AI SDK (`streamText`, `generateObject`)
- **Auth & tenancy:** Clerk Organisations for tenant identity
- **Infra:** Vercel Edge + Cron jobs

## What Changed

### 1) Data Layer Is Now Prisma v7 Native

- Prisma client uses the `prisma-client` generator with explicit output path.
- Database URLs are configured through `prisma.config.ts` (Prisma v7 style).
- Runtime client initialisation supports both:
  - direct Postgres connections (adapter mode), and
  - Prisma Accelerate URLs when required.

### 2) Schema Is Standardised for Multi-Tenant AI Workloads

The v1 schema includes:

- `Client`
- `AgentConfig`
- `Lead`
- `ProspectQueue`
- `EmailTemplate`
- `Conversation` (added for chat session persistence)

Key modelling decisions:

- UUID primary keys for safer external-facing identifiers.
- `clerkOrganizationId` on `Client` for tenant resolution.
- Snake_case table and column mapping for SQL clarity.
- `onDelete: Cascade` from `Lead -> Client` and `AgentConfig -> Client`.

### 3) AI Payload Fields Are JSONB

To support search and analytics on AI output, these fields use `@db.JsonB`:

- `Lead.chatTranscript`
- `Lead.scrapedData`
- `AgentConfig.knowledgeBase`

This enables future JSON-path filtering and better performance for structured AI data queries.

### 4) Indexing Is Explicit for Scale

Added/retained indexes to keep tenant and operational queries fast:

- `Client.subdomain`
- `Lead.status`
- `Lead.clientId + status` (composite)
- `ProspectQueue.status`
- `EmailTemplate.clientId + isDefault` (composite)

### 5) Conversation Model Added

- `Conversation` model stores chat sessions as JSONB with a `@unique` `sessionId`.
- Relations to `Client` (cascade) and optional `Lead` (set null).
- Tenant-isolation enforced at the service layer: conversation writes verify `clientId` ownership before updating.

### 6) Inbound Agent Tools Use Request-Scoped Factories

- The `searchKnowledgeBase` tool requires tenant context (`clientId`), so it is created per-request via `createSearchKnowledgeBaseTool(clientId)`.
- The tool barrel exports `createTools(clientId)` instead of a static object, keeping app-only context out of model-visible input.
- `UIMessage[]` is serialised through `toPrismaJson()` before persistence to satisfy the `Prisma.InputJsonValue` boundary.

## Architectural Pillars

## 1. Inbound Agent (Conversational Lead Capture) — Implemented

- **Chat interface:** `app/widget/[clientId]/_components/chat-widget.tsx` — client component using `useChat` + `DefaultChatTransport` with sessionStorage persistence.
- **Route brain:** `app/api/chat/route.ts` — Zod-validated POST handler using `createUIMessageStream` + `streamText` with `stepCountIs(5)` guard.
- **Tools (5):** `captureLeadDetails`, `checkAvailability`, `bookAppointment`, `searchKnowledgeBase` (factory), `handoffToHuman` — all using `tool()` + `inputSchema`.
- **Model router:** `lib/ai/model-router.ts` — selects Gemini Flash or Flash Lite based on tool scope.
- **Embed delivery:** `app/api/embed/[clientId]/route.ts` — cached JS loader for iframe injection.
- **Widget UI:** Minimal layout (no Clerk), server page loading AgentConfig, 3 client components (chat-widget, tool-status, chat-input).
- **Services:** `agent.service.ts` (config + knowledge search), `conversation.service.ts` (save/load with tenant isolation), `cal.service.ts` (Cal.com v2: username + eventTypeSlug), `lead.service.ts` (create from chat + handoff flagging).
- **AgentConfig:** `calComUsername` and `defaultEventSlug` optional; scheduling tools inject when present.
- **Outcome:** Visitor intent is captured, persisted to `Lead`, conversation stored in `Conversation`, then routed to booking flow.

## 2. Deep Scheduling Layer (Cal.com API v2)

- Use Cal.com API instead of a simple embed for full control.
- Provision users/event types during client onboarding.
- Consume booking/cancellation webhooks to keep lead state accurate.
- Build a white-labelled scheduling UI in-app.

## 3. Outbound Prospector (Programmatic Acquisition)

- Cron/server workflow ingests local business websites.
- Scraped content is audited with `generateObject` + strict Zod schema.
- If no AI capability is detected, draft personalised outreach and store for review.
- Queue status and retries are tracked in `ProspectQueue`.

## Delivery Principles

- Data-first changes before UI wiring.
- Strong contracts at boundaries (Zod + TypeScript strictness).
- Tenant isolation first, then feature expansion.
- Build and migration verification required before calling work complete.

---

## Update Block

**Last updated:** 2026-03-16

**What changed:** Cal.com API v2 integration. AgentConfig gained `calComUsername` and `defaultEventSlug` for per-client scheduling. `cal.service.ts` rewritten to v2 (username + eventTypeSlug). Scheduling tools converted to factories that inject config. South African scheduling rule added to system prompt. Vitest excludes e2e; `test:all` runs unit + Playwright. `.env.example` added.

**Verification performed:** `bun run test` (90 passed), `bun run build` (passed). E2E requires port 3000 free.
