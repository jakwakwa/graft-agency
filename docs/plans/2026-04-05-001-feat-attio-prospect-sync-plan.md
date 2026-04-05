---
title: "feat: Attio CRM — Push Prospects to List"
type: feat
status: active
date: 2026-04-05
---

# feat: Attio CRM — Push Prospects to List

## Overview

Add a manual "Push to Attio" button to the prospect triage dashboard. Clicking it pushes the prospect into the Attio List identified by `ATTIO_LIST_ID`. Adding to the list requires a Company record to exist in Attio first; the service creates or updates that Company record automatically as a prerequisite, then adds it to the list. Push state is persisted on the Lead row via a new `attioRecordId` field.

## Problem Frame

Prospects discovered by the Gemini AI pipeline live only in the local PostgreSQL database. Sales follow-up happens in Attio. There is no way to get a prospect from the Kona Agency triage queue into the Attio list without manually re-entering data. A "Push to Attio" button removes this manual handoff.

**Core outcome**: prospect appears in the Attio List (`ATTIO_LIST_ID`). Company record creation is a required prerequisite, not the end goal.

## Requirements Trace

- R1. Each lead in the triage table and detail page has a "Push to Attio" action
- R2. Pushing adds the prospect to the Attio List (`ATTIO_LIST_ID`) as an Entry
- R3. As a prerequisite for list entry, a Company record is upserted in Attio by domain (idempotent)
- R4. A note is attached to the Attio Company with pain points, outreach angle, and draft subject
- R5. Push is idempotent for the list entry and company upsert; a second push creates a second note (intentional audit trail)
- R6. Push state is visible in the UI — "Synced" badge when `attioRecordId` is set, loading/error feedback during the action

## Scope Boundaries

- No OAuth — API key auth only (`ATTIO_API_KEY`)
- No bulk push — per-lead only in this iteration
- No Attio → Kona sync (one-directional)
- No Attio People/Contact records — prospects are businesses, only Company records
- No retry logic on rate limiting — user retries manually
- No Inngest background job — synchronous user-triggered action

## Context & Research

### Relevant Code and Patterns

- [app/api/leads/[id]/approve/route.ts](app/api/leads/%5Bid%5D/approve/route.ts) — auth guard and lead fetch pattern to mirror exactly
- [lib/services/lead.service.ts](lib/services/lead.service.ts) — service layer shape; `attio.service.ts` follows this pattern
- [lib/auth/resolve-client.ts](lib/auth/resolve-client.ts) — `requirePlatformAccess()` for all route auth
- [app/(marketing)/dashboard/automation/queue/_components/triage-table.tsx](app/%28marketing%29/dashboard/automation/queue/_components/triage-table.tsx) — where to inject the CRM column
- [app/(marketing)/dashboard/automation/queue/[id]/page.tsx](app/%28marketing%29/dashboard/automation/queue/%5Bid%5D/page.tsx) — where to inject the action button
- `components/ui/badge.tsx`, `components/ui/button.tsx`, `components/ui/spinner.tsx` — existing UI primitives to reuse

### Institutional Learnings

- All automation API routes guard with `requirePlatformAccess()` before any DB access
- `Lead.scrapedData` is Prisma `Json?` — the `websiteUrl` needed for Attio domain matching lives here
- Tenant isolation enforced via `findFirst({ where: { id, clientId } })` — never trust route param alone
- Service files in `lib/services/` wrap external APIs with try/catch and return typed `{ error }` unions rather than throwing

## Key Technical Decisions

- **List entry is the primary goal; company upsert is a prerequisite**: The `ATTIO_LIST_ID` list entry is what matters. Company upsert runs first because Attio requires a record to exist before it can be added to a list.
- **Domain-based company deduplication**: `PUT /objects/companies/records` is idempotent when the domain attribute matches. An `extractDomain()` helper strips protocol and `www.` prefix. If domain extraction fails (no valid URL), return 422 — the push cannot proceed.
- **Write `attioRecordId` immediately after company upsert**: Prisma is updated before `addToList` and `addNote` calls. This means a partial failure (list entry or note failed) still results in a persisted record ID, giving an accurate "Synced (with warnings)" state rather than "Not synced".
- **`addToList` failure is the most critical warning**: If the company is created but not added to the list, the primary goal is unmet. The warning annotation must make this obvious ("⚠ Could not add to Attio list — check ATTIO_LIST_ID").
- **Reusable `PushToAttioButton` in `components/`**: Used in two route segments (table and detail page), so it lives in top-level `components/`, not a route-scoped `_components/` folder.

## Open Questions

### Resolved During Planning

- **When should prospects sync?** Manual push — a button per lead, not automatic on creation or approval.
- **Companies or People?** Prospects are businesses — Company records only. No Person records.
- **Note idempotency?** Second push creates a second note intentionally (audit trail). `wasAlreadySynced` flag in the response distinguishes first push from re-sync in the UI.
- **Primary goal?** Adding to the Attio List (`ATTIO_LIST_ID`). Company record creation is a prerequisite.

### Deferred to Implementation

- Whether `ATTIO_LIST_ID` should be per-client (stored in `ProspectingConfig`) vs. global (env var) — env var is sufficient for now
- Exact Attio API response envelope shape for `record_id` — verify against live API during implementation
- Whether 429 rate limiting is frequent enough to warrant automatic retry — observe in practice

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```
User clicks "Push to Attio" in triage UI
    ↓
POST /api/leads/[id]/push-to-attio
    ├─ requirePlatformAccess() → clientId
    ├─ prisma.lead.findFirst({ id, clientId, source: "OUTBOUND_PROSPECT" })
    ├─ Validate scrapedData.websiteUrl (Zod) → 422 if absent/unparseable
    │
    ├─ [PREREQ] attioService.upsertCompany({ customerName, websiteUrl })
    │       PUT /v2/objects/companies/records   [domain-based upsert]
    │       → { recordId }  ← Attio company UUID
    │       → 502 if fails (cannot add to list without a record)
    │
    ├─ prisma.lead.update({ attioRecordId: recordId })  ← write now
    │
    ├─ [PRIMARY] attioService.addToList({ recordId })
    │       PUT /v2/lists/{ATTIO_LIST_ID}/entries   [idempotent]
    │       → 200 + critical warning if this fails
    │
    ├─ [SECONDARY] attioService.addNote({ recordId, painPoints, ... })
    │       POST /v2/notes   [not idempotent — one note per push]
    │       → 200 + minor warning if this fails
    │
    └─ return { success, attioRecordId, wasAlreadySynced, warnings[] }
    ↓
PushToAttioButton updates local state
    ├─ success                   → "Synced" or "Re-synced" badge
    ├─ success + list warning    → badge + "⚠ Could not add to Attio list"
    ├─ success + note warning    → badge + "⚠ Note not created"
    └─ error (502)               → inline error text, button re-enabled
```

## Implementation Units

- [ ] **Unit 1: Prisma schema — add `attioRecordId` to Lead**

**Goal:** Persist the Attio company record ID on the Lead row to track sync state.

**Requirements:** R6

**Dependencies:** None — root dependency for all other units

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/[timestamp]_add_attio_record_id_to_leads/migration.sql` (auto-generated)

**Approach:**
- Add `attioRecordId String? @map("attio_record_id")` to the `Lead` model, after `nextActionDate` and before `createdAt`
- Run `prisma migrate dev --name add_attio_record_id_to_leads`
- No index needed at this stage

**Patterns to follow:**
- Nullable optional fields in `Lead`: `email String?`, `phone String?`, `nextActionDate DateTime?`

**Test scenarios:**
- Happy path: new lead created via `createFromOutbound` has `attioRecordId: null`
- After push: `lead.attioRecordId` is a non-null UUID string
- Existing mocks for `prisma.lead.create` still compile — field is optional

**Verification:**
- `prisma migrate status` shows migration applied
- `prisma generate` produces `Lead` type with `attioRecordId: string | null`

---

- [ ] **Unit 2: Attio API service — `lib/services/attio.service.ts`**

**Goal:** Encapsulate all Attio API calls behind three testable functions with consistent typed error returns.

**Requirements:** R2, R3, R4, R5

**Dependencies:** Unit 1

**Files:**
- Create: `lib/services/attio.service.ts`
- Modify: `lib/services/index.ts` (add barrel export)
- Test: `tests/unit/services/attio.service.test.ts`

**Approach:**
- Attio API base: `https://api.attio.com/v2`, Bearer `ATTIO_API_KEY`
- All functions return typed union: `{ recordId/entryId/noteId } | { error: string }` — never throw to caller
- Use native `fetch` — no new HTTP client dependency
- `extractDomain(url)`: `new URL(url)` wrapped in try/catch, strips leading `www.`, returns `null` on failure
- `upsertCompany({ customerName, websiteUrl })`: `PUT /objects/companies/records` with `name` and `domains` attributes. Fail fast if `ATTIO_API_KEY` absent or domain is null. Returns `{ recordId: body.data.id.record_id }` on 2xx
- `addToList({ recordId })`: `PUT /lists/{ATTIO_LIST_ID}/entries` — returns `{ error }` if `ATTIO_LIST_ID` env var absent. Returns `{ entryId }` on 2xx
- `addNote({ recordId, leadId, customerName, painPoints, targetOutreachAngle, draftSubject })`: `POST /notes` — plain text content with lead ID for auditability

**Env vars:**
- `ATTIO_API_KEY` — Bearer token from Attio Settings → API → Keys
- `ATTIO_LIST_ID` — UUID from Attio list URL: `app.attio.com/lists/<ATTIO_LIST_ID>`

**Patterns to follow:**
- Return union: `lib/services/cal.service.ts`
- Env var guard: `lib/services/email.service.ts`

**Test scenarios:**
- `upsertCompany` happy path: fetch called with `PUT`, domain `acme.com` extracted from `https://www.acme.com/about`, returns `{ recordId }`
- Missing `ATTIO_API_KEY`: returns `{ error }` without calling fetch
- Invalid/empty `websiteUrl`: returns `{ error: "Lead has no valid website URL" }`
- Attio returns 401: returns `{ error: "Attio company upsert failed: 401 ..." }`
- Attio returns 429: returns structured error, no retry
- `addToList` with missing `ATTIO_LIST_ID`: returns `{ error }` without calling fetch
- `addNote` with empty `painPoints[]`: note created, content shows "None identified"

**Verification:**
- `vitest run tests/unit/services/attio.service.test.ts` passes with stubbed `fetch`
- No real HTTP calls in tests
- TypeScript strict mode compiles with no implicit `any`

---

- [ ] **Unit 3: API route — `POST /api/leads/[id]/push-to-attio`**

**Goal:** Thin orchestration route — auth, fetch, validate, call service, write to Prisma, respond.

**Requirements:** R2, R3, R4, R5, R6

**Dependencies:** Unit 1 (schema), Unit 2 (service)

**Files:**
- Create: `app/api/leads/[id]/push-to-attio/route.ts`
- Test: `tests/unit/api/push-to-attio.test.ts`

**Approach:**
- Auth: `requirePlatformAccess()` → `{ clientId }` — identical pattern to `approve/route.ts`
- Lead fetch: `prisma.lead.findFirst({ where: { id, clientId, source: "OUTBOUND_PROSPECT" } })`
- Validate `scrapedData.websiteUrl` with inline Zod schema → 422 if absent or unparseable
- Orchestration:
  1. `upsertCompany(...)` → if `{ error }` → 502, no Prisma write
  2. `prisma.lead.update({ attioRecordId: recordId })` ← write before list/note
  3. `addToList({ recordId })` → if error → add to `warnings` as a critical warning
  4. `addNote(...)` → if error → add to `warnings` as a minor warning
- Response: `{ success: true, attioRecordId, wasAlreadySynced: boolean, warnings: { step, severity, error }[] }`
- `wasAlreadySynced`: `!!lead.attioRecordId` before the push

**Error taxonomy:**
- 401 — Clerk auth failure
- 404 — lead not found for this client
- 422 — INBOUND source, or missing/invalid `websiteUrl`
- 502 — Attio API failed on company upsert (primary prerequisite failed)
- 200 + `warnings` — partial success

**Patterns to follow:**
- `app/api/leads/[id]/approve/route.ts` — auth + fetch + update
- Inline Zod: `app/api/prospect-queue/route.ts`

**Test scenarios:**
- Unauthenticated → 401
- Wrong `clientId` → 404
- INBOUND source → 422
- No `scrapedData.websiteUrl` → 422
- All calls succeed → 200, `attioRecordId` in DB, `wasAlreadySynced: false`
- Second push → 200, `wasAlreadySynced: true`
- `upsertCompany` errors → 502, Prisma NOT updated
- `addToList` fails → 200 + critical warning, `attioRecordId` IS persisted
- `addNote` fails → 200 + minor warning, `attioRecordId` IS persisted

**Verification:**
- Compiles in TypeScript strict mode
- `vitest run tests/unit/api/push-to-attio.test.ts` passes
- Manual push with invalid key → 502 with meaningful error body
- DB row shows `attio_record_id` after successful push

---

- [ ] **Unit 4: UI — `PushToAttioButton` component and integration**

**Goal:** Reusable client component with loading/success/error states, integrated into both the triage table and lead detail page.

**Requirements:** R1, R6

**Dependencies:** Unit 3

**Files:**
- Create: `components/push-to-attio-button.tsx`
- Modify: `app/(marketing)/dashboard/automation/queue/_components/triage-table.tsx`
- Modify: `app/(marketing)/dashboard/automation/queue/[id]/page.tsx`

**Approach:**
- Props: `leadId: string`, `initialSynced?: boolean` (from `!!lead.attioRecordId`)
- State machine: `idle | loading | success | error`. Mount as `success` if `initialSynced=true`
- `handlePush`: `POST /api/leads/${leadId}/push-to-attio`, parse JSON, branch on `res.ok`
- Success: show "Synced" or "Re-synced" badge; if `warnings` present show severity-appropriate annotation ("⚠ Could not add to Attio list — check ATTIO_LIST_ID" for list failure)
- Error (502): inline `text-destructive` text, button re-enabled
- `initialSynced=true`: show "Synced" badge + secondary "Push again" button (not primary — prevents accidental re-syncs)

**`triage-table.tsx` changes:**
- Add `attioRecordId: string | null` to `TriageLead` interface
- Add 6th "CRM" column with `hidden sm:table-cell` class
- Cell: `<PushToAttioButton leadId={lead.id} initialSynced={!!lead.attioRecordId} />`

**Detail page changes:**
- Add `attioRecordId: string | null` to local `Lead` interface
- Add `<PushToAttioButton ... />` to the existing actions button group

**Patterns to follow:**
- `Spinner`: `components/ui/spinner.tsx`
- `Badge`: `components/ui/badge.tsx`
- `text-destructive`: inline error pattern across dashboard pages
- Button group layout: existing actions in `[id]/page.tsx`

**Test scenarios:**
- `initialSynced=false`: primary "Push to Attio" button visible
- `initialSynced=true`: "Synced" badge + "Push again" secondary button
- Click → button disabled, spinner visible
- Success response → badge rendered
- 502 response → error text, button re-enabled
- List warning in response → badge + critical warning annotation

**Verification:**
- Compiles without TypeScript errors
- End-to-end: push a lead → reload → "Synced" badge renders from persisted DB state (not ephemeral local state)
- Mobile: CRM column hidden in triage table, button still visible on detail page

---

## System-Wide Impact

- **`attioRecordId` on Lead**: new nullable column; existing leads are `null`. No breaking change — additive.
- **`GET /api/leads` response**: includes `attioRecordId` after migration. Additive field, no existing consumers break.
- **`ATTIO_API_KEY` is server-only**: must never appear in `NEXT_PUBLIC_` vars or client components. The service file has no `"use client"` directive.
- **Missing env vars**: `attioService` returns `{ error }` cleanly — no crash. Route returns 502 or warning-flagged 200.
- **Multi-tenant note**: `ATTIO_LIST_ID` is a single global env var. All clients push to the same list. If per-client lists are needed later, `ProspectingConfig` is the natural home.

## Risks & Dependencies

- **Attio API response envelope**: plan assumes `data.id.record_id` from company upsert. Verify against live Attio v2 API during implementation.
- **`ATTIO_LIST_ID` misconfiguration**: wrong UUID causes `addToList` to fail with a critical warning. The Company is in Attio but not in the list — the primary goal is unmet. UI must make this obvious.
- **Domain matching edge cases**: leads with no valid `websiteUrl` (Facebook-only, etc.) hit 422. Add a UI tooltip explaining the requirement.
- **Attio rate limiting (429)**: single manual push unlikely to hit limits. Document retry advice in error state copy.

## New Environment Variables Required

| Variable | Required | Used In |
|---|---|---|
| `ATTIO_API_KEY` | Yes | `lib/services/attio.service.ts` |
| `ATTIO_LIST_ID` | Yes | `lib/services/attio.service.ts` |

## Sources & References

- Related code: [app/api/leads/[id]/approve/route.ts](app/api/leads/%5Bid%5D/approve/route.ts) — route pattern to mirror
- Related code: [lib/services/lead.service.ts](lib/services/lead.service.ts) — service shape to follow
- Related code: [prisma/schema.prisma](prisma/schema.prisma) — Lead model to extend
- Attio REST API v2: `https://api.attio.com/v2` (Bearer token auth)
- Company upsert: `PUT /v2/objects/companies/records` (domain-based idempotent upsert)
- List entries: `PUT /v2/lists/{list_id}/entries` (idempotent by `record_id`)
- Notes: `POST /v2/notes` (not idempotent — one note per push, intentional)
