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

## Architectural Pillars

## 1. Inbound Agent (Conversational Lead Capture)

- **Chat interface:** React component using `useChat` for streaming.
- **Route brain:** `app/api/chat/route.ts` with `streamText`.
- **Tooling model:** Zod-typed tools (for example `captureLeadDetails`, booking tools).
- **Outcome:** Visitor intent is captured, persisted to `Lead`, then routed to booking flow.

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
