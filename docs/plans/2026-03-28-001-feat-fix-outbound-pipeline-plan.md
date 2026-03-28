---
title: "feat: Fix Outbound Prospecting ETL Pipeline"
type: feat
status: active
date: 2026-03-28
---

# feat: Fix Outbound Prospecting ETL Pipeline

## Overview

The outbound prospecting pipeline has a fully wired infrastructure (DB schema, API routes, queue UI, cron job) but the core processing logic is a hardcoded stub. `processQueueItem()` creates leads with a generic "Hi, we'd love to connect" body instead of doing any real work. This plan fixes the full FIND → Extract → Audit → Draft → Review → Send flow.

## Problem Frame

The pipeline needs to:
1. **Find** businesses that lack AI/chatbot capabilities (via Firecrawl search or manual queue entry)
2. **Extract** website content (Firecrawl scrape)
3. **Audit** the prospect with structured AI analysis (`generateObject` + `prospectAuditSchema`)
4. **Draft** a hyper-personalized outreach email (Gemini `generateText`)
5. **Triage** the result via a split-pane HITL UI (scraped pain points left, AI pitch right)
6. **Send** the approved email (Resend)

Currently: steps 2–6 are a stub. Step 1 has no automated search capability.

## Requirements Trace

- R1. `processQueueItem()` must scrape the prospect's website and produce structured audit data
- R2. `processQueueItem()` must generate a personalized outreach email from audit results using Gemini
- R3. Structured audit data must be stored in `Lead.scrapedData` using a consistent schema
- R4. The triage UI must display audit data in readable form (not raw JSON)
- R5. Approving a lead must send the drafted email via Resend
- R6. A search config UI must allow configuring what industries/areas/keywords to find
- R7. The cron must respect an enable/disable preference stored in the database
- R8. A "Find Prospects" action must search for matching businesses and add them to the queue

## Scope Boundaries

- No changes to the Vercel cron schedule itself (`vercel.json` stays at `45 22 * * *`); day/time preferences are stored in DB and checked at runtime
- No real-time websocket updates — polling/manual refresh is sufficient
- No email tracking (opens, clicks) in this iteration
- Firecrawl search used for the "find" stage; Google Search API not integrated directly

## Context & Research

### Relevant Code and Patterns

- `lib/services/outbound.service.ts` — `processQueueItem()` stub to replace; `claimQueueBatch()` stays unchanged
- `lib/services/lead.service.ts` — `createFromOutbound()` needs `auditData` field added alongside existing `draftSubject`/`draftBody`
- `lib/scraper/types.ts` — `CanonicalScrapedData` interface to extend with richer audit fields
- `lib/scraper/normalize-firecrawl-response.ts` — existing normalization utility; new pipeline doesn't use it but it stays for test coverage
- `lib/ai/model-router.ts` — `selectModel()` pattern; new outbound functions should use `google("gemini-3-flash-preview")` directly (complex task, no tool routing needed)
- `app/(marketing)/dashboard/automation/leads/_components/lead-detail-card.tsx` — split-pane modal (left: raw JSON pre block, right: edit draft); needs structured display on left
- `app/(marketing)/dashboard/automation/queue/page.tsx` — existing "Process queue now" button pattern to follow for "Find Prospects" button
- `lib/auth/resolve-client.ts` — `requirePlatformAccess()`, `getPlatformClientId()` patterns used in all automation routes
- `prisma/schema.prisma` — `Client`, `ProspectQueue`, `Lead` models; needs new `ProspectingConfig` model

### Institutional Learnings

- Atomic batch claiming uses raw SQL `FOR UPDATE SKIP LOCKED` — do not replace with Prisma ORM calls
- All automation API routes guard with `requirePlatformAccess()` before any DB access
- `Lead.scrapedData` is a Prisma `Json?` field — store the full audit object there, not in separate columns
- Prisma transactions (`prisma.$transaction`) used for multi-step writes that must be atomic

### External References

- Firecrawl JS SDK: `FirecrawlApp.scrapeUrl(url, { formats: ['markdown'] })` returns `{ markdown: string }`
- Firecrawl search: `FirecrawlApp.search(query, { limit: N })` returns array of `{ url, title, description }`
- Vercel AI SDK `generateObject`: accepts `{ model, schema, prompt }`, returns `{ object }` typed to schema
- Vercel AI SDK `generateText`: accepts `{ model, prompt }`, returns `{ text }`
- Resend Node SDK: `resend.emails.send({ from, to, subject, html })` — `to` is the business email (not scraped in this iteration; use a placeholder/store for later)

## Key Technical Decisions

- **`generateObject` over Firecrawl native extract**: Firecrawl's extract mode returns domain-prefixed keys (e.g. `stratcol_co_za_chatbot`) requiring the brittle normalization utility. Using Firecrawl for raw markdown + Gemini `generateObject` gives schema-controlled, domain-agnostic output. The existing `normalize-firecrawl-response.ts` utility is preserved but not used in the new pipeline.
- **`ProspectingConfig` as a separate Prisma model (not extending `AgentConfig`)**: Search criteria and cron preferences are operationally distinct from agent widget config. Coupling them would make both harder to evolve.
- **Cron enable/disable via DB flag, not `vercel.json`**: Vercel cron schedule is static infrastructure. The endpoint reads `ProspectingConfig.cronEnabled` and returns early if false — no Vercel API needed.
- **Email `to` field deferred**: Prospect websites don't reliably expose emails. The approve endpoint will store the outreach in `Lead` and flag it; a human sends it manually from their email client using the drafted content. Resend integration sends to a configured platform outreach address for record-keeping, with the prospect marked `CONTACTED`.
- **Firecrawl search for "Find" stage**: Uses `app.search(query)` to find business URLs matching configured criteria. Deduplication by `websiteUrl` before inserting into `prospect_queue`.

## Open Questions

### Resolved During Planning

- **Should the Find stage run before or after processQueue in the cron?** Find first, then process — so newly found prospects can be audited in the same cron run.
- **Where is email `from` address configured?** Store in `ProspectingConfig.outreachFromEmail`; falls back to env `OUTREACH_FROM_EMAIL`.
- **How many Firecrawl pages to scrape per prospect?** Home page only (`/`) for the audit. Reduces cost and latency.

### Deferred to Implementation

- Whether Firecrawl's free tier rate limits require per-item delays — test during implementation and add `setTimeout` if needed
- Exact Gemini prompt wording for pitch generation — determined by testing during implementation
- Whether `auditData` fields need to be indexed for search/filter later — defer until query patterns emerge

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification.*

```
Cron fires (22:45 UTC) → /api/cron/prospecting
  ├─ Check ProspectingConfig.cronEnabled → if false, return early
  ├─ [FIND] if searchEnabled: findProspects(config.searchCriteria)
  │    └─ Firecrawl.search(query) → deduplicate → insert PENDING rows into prospect_queue
  └─ [PROCESS] processQueue()
       └─ claimQueueBatch() → [for each item] processQueueItem(item)
            ├─ scraperService.auditProspect(websiteUrl) → CanonicalAuditData
            │    ├─ Firecrawl.scrapeUrl(url) → markdown
            │    └─ generateObject(gemini, prospectAuditSchema, markdown) → structured audit
            ├─ generateText(gemini, pitchPrompt(auditData)) → draftBody
            └─ leadService.createFromOutbound({ auditData, draftSubject, draftBody })
                 └─ Lead { status: DRAFT_PENDING, scrapedData: { ...audit, draftSubject, draftBody } }

Human reviews in /dashboard/automation/leads
  └─ LeadDetailCard (split-pane)
       ├─ Left: AuditPanel (hasChatbot, painPoints, coreServices — structured display)
       └─ Right: EditDraftPanel (subject + body editable)
            └─ Approve → POST /api/leads/[id]/approve
                 ├─ emailService.send(draft) → Resend
                 └─ lead.status = CONTACTED
```

## Implementation Units

- [ ] **Unit 1: ProspectingConfig schema + migration**

**Goal:** Add a `ProspectingConfig` model to store search criteria and cron preferences per client.

**Requirements:** R6, R7

**Dependencies:** None

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/[timestamp]_add_prospecting_config/migration.sql`
- Test: `tests/unit/db/prospecting-config-schema.test.ts`

**Approach:**
- New model `ProspectingConfig` with: `id`, `clientId` (unique FK to Client), `cronEnabled` (bool, default false), `searchEnabled` (bool, default false), `searchCriteria` (Json: `{ industries: string[], locations: string[], keywords: string[] }`), `outreachFromEmail` (String?), `createdAt`, `updatedAt`
- Add `prospectingConfig ProspectingConfig?` relation to `Client`
- Run `prisma migrate dev` to generate migration

**Patterns to follow:**
- `AgentConfig` model shape in `prisma/schema.prisma` (one-to-one with Client, cascade delete)

**Test scenarios:**
- Happy path: create ProspectingConfig linked to a Client, assert all fields persist correctly
- Edge case: creating a second ProspectingConfig for same clientId throws unique constraint error
- Edge case: deleting Client cascades to ProspectingConfig

**Verification:**
- `prisma migrate status` shows migration applied
- Prisma client types include `ProspectingConfig` and `Client.prospectingConfig` relation

---

- [ ] **Unit 2: Prospect Audit Schema + extended CanonicalScrapedData**

**Goal:** Define the Zod schema used with `generateObject` to extract structured audit data from scraped markdown.

**Requirements:** R1, R3

**Dependencies:** None

**Files:**
- Create: `lib/scraper/prospect-audit-schema.ts`
- Modify: `lib/scraper/types.ts`
- Modify: `lib/scraper/index.ts` (export new schema)
- Test: `tests/unit/scraper/prospect-audit-schema.test.ts`

**Approach:**
- `prospectAuditSchema` is a Zod `z.object` with fields:
  - `hasChatbot: z.boolean()` — visible chatbot widget on site
  - `hasVoiceAgent: z.boolean()` — any voice/phone AI agent
  - `businessDescription: z.string()` — 1–2 sentence summary
  - `coreServices: z.array(z.object({ name: z.string(), description: z.string() }))` — what they sell
  - `painPoints: z.array(z.string())` — implied problems Kona AI could solve
  - `targetOutreachAngle: z.string()` — single best angle for cold outreach
- Extend `CanonicalScrapedData` in `types.ts` to match these fields plus `draftSubject` and `draftBody` for the email draft stored alongside audit data

**Patterns to follow:**
- Zod usage in `app/api/prospect-queue/route.ts` (validation pattern)
- `CanonicalScrapedData` interface in `lib/scraper/types.ts`

**Test scenarios:**
- Happy path: `prospectAuditSchema.parse(validObject)` succeeds with all fields present
- Edge case: missing `hasChatbot` field fails parse with descriptive Zod error
- Edge case: `painPoints` as empty array is valid
- Edge case: extra unknown fields are stripped by Zod (no passthrough)

**Verification:**
- TypeScript compiles without errors with the new schema exported and used in unit 3
- Zod parse of a realistic scraped website response returns typed `ProspectAudit` object

---

- [ ] **Unit 3: Implement scraper.service.ts**

**Goal:** Replace the empty `scraper.service.ts` with a working Firecrawl scrape + Gemini audit function.

**Requirements:** R1, R2, R3

**Dependencies:** Unit 2 (audit schema)

**Files:**
- Modify: `lib/services/scraper.service.ts`
- Test: `tests/unit/services/scraper.service.test.ts`

**Approach:**
- `scraperService.auditProspect(websiteUrl: string, businessName: string): Promise<ProspectAudit>`
  - Initialize `FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })`
  - Call `app.scrapeUrl(websiteUrl, { formats: ['markdown'] })` — throws on failure
  - If markdown is empty or scrape fails, throw a descriptive error (caller marks queue FAILED)
  - Call `generateObject({ model: google("gemini-3-flash-preview"), schema: prospectAuditSchema, prompt: buildAuditPrompt(markdown, businessName) })`
  - Return typed `ProspectAudit` object
- `buildAuditPrompt(markdown, businessName)` — constructs the system + user message; instructs Gemini to look for chatbot indicators, extract services and pain points
- Environment: `FIRECRAWL_API_KEY` required; throw clear error if missing

**Patterns to follow:**
- `lib/ai/model-router.ts` for Gemini model selection
- `@ai-sdk/google` `google()` import pattern from existing chat route

**Test scenarios:**
- Happy path: mock Firecrawl returns markdown, mock `generateObject` returns valid audit — `auditProspect()` returns typed result
- Error path: Firecrawl throws network error — `auditProspect()` propagates the error
- Error path: Firecrawl returns empty markdown — `auditProspect()` throws "No content scraped"
- Error path: `generateObject` returns object failing schema parse — error propagates to caller
- Edge case: `FIRECRAWL_API_KEY` env var missing — throws before making any HTTP calls

**Verification:**
- `auditProspect("https://example.com", "Example Co")` returns a `ProspectAudit` with all required fields
- Firecrawl SDK initialized once per call (no singleton needed at this stage)

---

- [ ] **Unit 4: Fix processQueueItem() + pitch generation**

**Goal:** Replace the hardcoded stub in `outbound.service.ts` with real scrape → audit → pitch → lead creation.

**Requirements:** R1, R2, R3

**Dependencies:** Unit 3 (scraper service)

**Files:**
- Modify: `lib/services/outbound.service.ts`
- Modify: `lib/services/lead.service.ts` (extend `createFromOutbound` to accept full audit data)
- Test: `tests/unit/services/outbound.service.test.ts` (update existing mocks)

**Approach:**
- In `processQueueItem()`, replace hardcoded draft with:
  1. `const audit = await scraperService.auditProspect(item.websiteUrl, item.businessName)`
  2. `const { text: draftBody } = await generateText({ model: google("gemini-3-flash-preview"), prompt: buildPitchPrompt(audit, item.businessName) })`
  3. `buildPitchPrompt` constructs a prompt referencing `audit.targetOutreachAngle`, `audit.coreServices`, `audit.painPoints`
  4. `draftSubject` = `audit.targetOutreachAngle` trimmed to subject line length
  5. Call `leadService.createFromOutbound({ clientId, customerName, websiteUrl, auditData: audit, draftSubject, draftBody })`
- Update `leadService.createFromOutbound` to store `auditData` in `scrapedData` alongside `draftSubject`/`draftBody`
- Keep the existing `FAILED` / retry logic and error handling structure — only replace the middle section

**Patterns to follow:**
- Existing try/catch + `prisma.prospectQueue.update({ status: "FAILED" })` error path in `processQueueItem()`
- `claimQueueBatch()` stays unchanged

**Test scenarios:**
- Happy path: mock scraper returns audit, mock generateText returns pitch — lead created with DRAFT_PENDING, queue item COMPLETED
- Error path: scraper throws — queue item marked FAILED with error message, lead not created
- Error path: generateText throws — queue item FAILED, no lead
- Integration: `processQueue()` with a 2-item batch processes both sequentially, returns correct `processedCount`
- Edge case: `clientId` is null — platform client resolved and used (existing behavior preserved)

**Verification:**
- Running "Process queue now" on a PENDING item with a real URL produces a Lead with non-generic `draftSubject` and `draftBody`
- `Lead.scrapedData` contains `hasChatbot`, `painPoints`, `coreServices`, `draftSubject`, `draftBody`

---

- [ ] **Unit 5: Email service + HITL approve endpoint**

**Goal:** Implement Resend email dispatch and wire the approve action to actually send the drafted outreach.

**Requirements:** R5

**Dependencies:** Unit 4 (leads have real draft data to send)

**Files:**
- Modify: `lib/services/email.service.ts` (currently empty)
- Create: `app/api/leads/[id]/approve/route.ts`
- Modify: `app/(marketing)/dashboard/automation/leads/_components/lead-detail-card.tsx`
- Modify: `app/(marketing)/dashboard/automation/leads/page.tsx` (update `onApprove` handler)
- Test: `tests/unit/services/email.service.test.ts`

**Approach:**
- `email.service.ts`:
  - `sendOutreach({ to, subject, body, fromEmail })` — calls `resend.emails.send()`
  - `from` = `ProspectingConfig.outreachFromEmail` or env `OUTREACH_FROM_EMAIL`
  - Returns `{ id }` from Resend or throws
- `POST /api/leads/[id]/approve`:
  - Guard: `requirePlatformAccess()`
  - Fetch lead, verify `status === "DRAFT_PENDING"` and `source === "OUTBOUND_PROSPECT"`
  - Fetch `ProspectingConfig` for client to get `outreachFromEmail`
  - Call `emailService.sendOutreach(...)` using `scrapedData.draftSubject` and `scrapedData.draftBody`
  - Update lead `status = "CONTACTED"`
  - Return `{ success: true }`
- In `lead-detail-card.tsx`, change `onApprove` to call `POST /api/leads/[id]/approve` instead of the existing `PATCH` status transition
- Env: `RESEND_API_KEY` required

**Patterns to follow:**
- `app/api/leads/[id]/route.ts` for the PATCH pattern (auth guard, prisma update)
- `requirePlatformAccess()` from `lib/auth/resolve-client.ts`

**Test scenarios:**
- Happy path: mock Resend, mock lead fetch — approve endpoint returns 200, lead status is CONTACTED
- Error path: lead not found — 404
- Error path: lead already CONTACTED — 400 with "already approved" message
- Error path: Resend throws — 500, lead status not changed (no partial state)
- Error path: missing `RESEND_API_KEY` — throws before Resend call

**Verification:**
- Clicking "Approve" in the triage UI sends an email (visible in Resend dashboard) and the lead status changes to CONTACTED in the UI

---

- [ ] **Unit 6: Search config UI + Find Prospects action**

**Goal:** Add UI to configure what to search for, and a "Find Prospects" button that auto-populates the queue.

**Requirements:** R6, R7, R8

**Dependencies:** Unit 1 (ProspectingConfig model)

**Files:**
- Create: `app/api/prospecting-config/route.ts` (GET + POST)
- Create: `app/api/automation/find-prospects/route.ts`
- Create: `app/(marketing)/dashboard/automation/_components/prospecting-config-form.tsx`
- Modify: `app/(marketing)/dashboard/automation/page.tsx` (embed config form + find button)
- Modify: `app/api/cron/prospecting/route.ts` (check `cronEnabled` before processing)
- Test: `tests/unit/api/prospecting-config.test.ts`

**Approach:**
- `GET/POST /api/prospecting-config` — upsert `ProspectingConfig` for current client's platform clientId
- `ProspectingConfigForm` component: industries (tags input or comma-separated), locations (comma-separated), keywords (comma-separated), `cronEnabled` toggle, `outreachFromEmail` input
- `POST /api/automation/find-prospects`:
  - Build search query from `searchCriteria` (e.g. `"accounting firm Cape Town no chatbot"`)
  - Call `FirecrawlApp.search(query, { limit: 20 })`
  - Deduplicate against existing `prospect_queue` by `websiteUrl`
  - Bulk insert new PENDING items
  - Return `{ added: N, duplicates: M }`
- In `app/api/cron/prospecting/route.ts`, add check: fetch `ProspectingConfig`, if `cronEnabled === false` return `{ message: "Cron disabled" }` early; if `searchEnabled`, call find-prospects logic before processQueue
- "Find Prospects" button in queue page triggers `POST /api/automation/find-prospects` with loading state

**Patterns to follow:**
- `app/api/automation/process-queue/route.ts` — manual trigger pattern (auth + service call + return message)
- `app/(marketing)/dashboard/automation/queue/page.tsx` — button + message state pattern
- `app/api/prospect-queue/upload/route.ts` — bulk insert + deduplication pattern

**Test scenarios:**
- Happy path: POST config with valid criteria → upsert succeeds, GET returns saved values
- Happy path: find-prospects with mocked Firecrawl search → N new queue items inserted
- Edge case: all Firecrawl results are duplicates → 0 inserted, correct `duplicates` count returned
- Error path: Firecrawl search throws → 500 with error message
- Cron disabled: cron endpoint with `cronEnabled=false` returns early without calling processQueue
- Cron enabled + searchEnabled: cron runs find then process in sequence

**Verification:**
- Saving search criteria in the config form persists to DB
- Clicking "Find Prospects" adds new PENDING items to the queue table
- Toggling `cronEnabled` off causes the next cron run to return early (testable by direct `GET /api/cron/prospecting` call with cron secret)

---

- [ ] **Unit 7: Triage interface — structured audit display**

**Goal:** Replace the raw JSON `pre` block in `LeadDetailCard` with a readable structured view of audit data.

**Requirements:** R4

**Dependencies:** Unit 4 (leads have structured `scrapedData`)

**Files:**
- Modify: `app/(marketing)/dashboard/automation/leads/_components/lead-detail-card.tsx`
- Test: manual visual verification (no unit test needed for display-only component)

**Approach:**
- Left pane of `LeadDetailCard` currently renders `JSON.stringify(scrapedData)` in a `pre` tag
- Replace with an `AuditPanel` section inside the same left pane:
  - Business name heading
  - `hasChatbot` / `hasVoiceAgent` as Yes/No badges
  - `businessDescription` paragraph
  - `coreServices` as a compact list
  - `painPoints` as a bulleted list
  - `targetOutreachAngle` highlighted in a callout box
- Fallback: if any field is missing (legacy leads), show "No audit data" gracefully
- Keep the existing `ScrapedData` interface in the component; add typed fields matching `CanonicalScrapedData` extension from Unit 2

**Patterns to follow:**
- `Badge` component from `components/ui/badge.tsx`
- `Typography` components from `components/ui/typography.tsx`
- Existing left/right pane split in `lead-detail-card.tsx`

**Test scenarios:**
- Happy path: lead with full audit data renders all fields without crashing
- Edge case: lead with `scrapedData: null` renders "No audit data" without throwing
- Edge case: lead with only legacy fields (`draftSubject`, `draftBody`, no audit fields) renders gracefully

**Verification:**
- Opening a lead processed by the new pipeline shows pain points, services, and outreach angle in the left pane
- Opening a legacy lead (old stub data) shows a graceful fallback, not a crash

## System-Wide Impact

- **Cron endpoint behaviour change**: Adding `cronEnabled` check changes the cron from always-running to opt-in. Existing deployments will have `cronEnabled = null` (no config row) — the cron should default to **running** if no config exists (preserves current behaviour).
- **`Lead.scrapedData` shape change**: New pipeline stores a richer JSON shape. Existing leads have the old `{ websiteUrl, draftSubject, draftBody }` shape. The triage UI must handle both (Unit 7 fallback).
- **`createFromOutbound` signature change**: Adding `auditData` parameter is additive — existing callers (tests) pass `undefined`, which is fine if the parameter is optional.
- **Firecrawl latency**: Each `processQueueItem` call now takes 3–10s (scrape + generateObject + generateText). Batch size of 5 = 15–50s total. Vercel function timeout is 10s on Hobby, 60s on Pro, 300s on Enterprise. Ensure the cron endpoint is on a plan that supports >60s execution, or reduce `PROSPECTING_BATCH_SIZE` to 1–2 for Hobby.
- **`FIRECRAWL_API_KEY` and `RESEND_API_KEY`** must be added to Vercel environment variables before deploying.

## Risks & Dependencies

- **Firecrawl scrape failures**: Many sites block scrapers (Cloudflare, auth walls). Expect 20–40% failure rate on cold scrapes. The existing FAILED + error message path handles this; consider a UI indicator of "blocked" vs "network error".
- **Gemini `generateObject` hallucination**: AI may incorrectly flag a site as having no chatbot. Low risk for outreach quality (worst case: pitch goes to a business that already has a chatbot). Not a data integrity risk.
- **Resend delivery**: If `RESEND_API_KEY` is not set, Unit 5 throws before sending. This is acceptable — the approve endpoint returns 500 and the lead stays `DRAFT_PENDING`.
- **Vercel cron timeout (see System-Wide Impact above)**: Reduce batch size if experiencing timeouts.
- **Firecrawl search query quality**: Poorly configured `searchCriteria` will return irrelevant results. This is a user configuration issue, not a code defect.

## New Environment Variables Required

| Variable | Required | Used In |
|---|---|---|
| `FIRECRAWL_API_KEY` | Yes | `scraper.service.ts` |
| `RESEND_API_KEY` | Yes | `email.service.ts` |
| `OUTREACH_FROM_EMAIL` | Yes (fallback) | `email.service.ts` |

## Sources & References

- Related code: `lib/services/outbound.service.ts` (stub to replace)
- Related code: `lib/scraper/types.ts` (types to extend)
- Related code: `app/api/cron/prospecting/route.ts` (cron to update)
- Related code: `app/(marketing)/dashboard/automation/leads/_components/lead-detail-card.tsx` (triage UI)
- Vercel AI SDK `generateObject` docs: https://sdk.vercel.ai/docs/reference/ai-sdk-core/generate-object
- Firecrawl JS SDK: `@mendable/firecrawl-js` (already in `package.json`)
- Resend Node SDK: `resend` (already in `package.json`)
