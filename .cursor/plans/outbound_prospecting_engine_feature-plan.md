---
name: Outbound Prospecting Engine (Gold Rush)
overview: "Gold Rush–compliant plan. Schema migration (clientId) FIRST. Failing tests BEFORE implementation in each phase."
isProject: true
---

# Outbound Prospecting Engine — Feature Plan

**Gold Rush compliance:** Schema before logic. Failing tests before implementation.

---

## File Tree (Structural Auditor)

### New files

| Layer | Path |
|-------|------|
| Types | `lib/scraper/types.ts` |
| Scraper | `lib/scraper/normalize-firecrawl-response.ts` |
| Scraper | `lib/scraper/index.ts` |
| Service | `lib/services/scraper.service.ts` |
| Service | `lib/services/outbound.service.ts` |
| Tools | `lib/ai/tools/outbound/gemini-google-search.ts` |
| Tools | `lib/ai/tools/outbound/scrape-target-website.ts` |
| Tools | `lib/ai/tools/outbound/draft-bespoke-outreach.ts` |
| API | `app/api/outbound/search/route.ts` |
| API | `app/api/outbound/scrape/route.ts` |
| API | `app/api/outbound/draft/route.ts` |
| Migration | `prisma/migrations/YYYYMMDD_add_prospect_queue_client_lead/migration.sql` |

### Edit existing

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `clientId`, `leadId` to ProspectQueue; relations on Client, Lead |
| `lib/ai/tools/index.ts` | Export outbound tools |
| `.env.example` | Add `FIRECRAWL_API_KEY` |

### Reuse existing

- `lib/db/prisma.ts`
- `lib/ai/model-router.ts`
- `lib/services/lead.service.ts`

---

## Exact Vitest Cases (TDD Order)

### Step 02 — Types & DB + Contract (failing test first)

| Test file | Case | Expectation |
|-----------|------|-------------|
| `tests/unit/db/prospect-queue-schema.test.ts` | `creates ProspectQueue with clientId and persists` | `prisma.prospectQueue.create({ data: { clientId, businessName, websiteUrl } })` succeeds; `findMany({ where: { clientId } })` returns it |
| `tests/unit/db/prospect-queue-schema.test.ts` | `creates ProspectQueue with leadId after Lead exists` | Create Lead, create ProspectQueue with leadId; relation resolves |
| `tests/unit/db/prospect-queue-schema.test.ts` | `rejects ProspectQueue without clientId when tenant isolation required` | Service layer enforces clientId for create (test via outbound.service) |

**Failing test must be written before schema migration.** Test defines the contract.

### Step 03 — Logic (failing test first, then implement)

| Test file | Case | Expectation |
|-----------|------|-------------|
| `tests/unit/scraper/normalize-firecrawl-response.test.ts` | `maps domain-specific keys to canonical shape` | `stratcol_co_za_chatbot` → `hasChatbot`, `*_core_services` → `coreServices` |
| `tests/unit/scraper/normalize-firecrawl-response.test.ts` | `ignores citation keys when resolving booleans` | `foo_chatbot_citation` not used for hasChatbot |
| `tests/unit/scraper/normalize-firecrawl-response.test.ts` | `handles empty or null input` | Returns `{ hasChatbot: false, hasVoiceAgent: false, coreServices: [] }` |
| `tests/unit/services/scraper.service.test.ts` | `scrapeTargetWebsite returns canonical shape` | Mock Firecrawl; assert `normalizeFirecrawlResponse` applied |
| `tests/unit/services/scraper.service.test.ts` | `scrapeTargetWebsite rejects when FIRECRAWL_API_KEY missing` | Throws or returns error |
| `tests/unit/services/outbound.service.test.ts` | `createProspectQueue requires clientId` | Throws if clientId omitted |
| `tests/unit/services/outbound.service.test.ts` | `createProspectQueue creates queue item with clientId` | Prisma create succeeds; clientId set |
| `tests/unit/services/outbound.service.test.ts` | `processQueue creates Lead with clientId from queue` | Lead.clientId === ProspectQueue.clientId |

### Step 04 — UI (Playwright)

| Test file | Case | Expectation |
|-----------|------|-------------|
| `tests/e2e/outbound.spec.ts` | `POST /api/outbound/search with location+service returns businesses` | 200, JSON array of businesses |
| `tests/e2e/outbound.spec.ts` | `POST /api/outbound/search without auth returns 401` | Requires tenant context (if protected) |

---

## Phase Order (Mandatory)

1. **Step 02 first:** Schema migration + failing Vitest for ProspectQueue + clientId. **No logic without this.**
2. **Step 03:** For each module: write failing test → implement → test passes.
3. **Step 04:** Playwright for API routes.
4. **Step 05:** Completion-verifier, `test:all`, `build`.

---

## Schema Contract (Step 02)

```prisma
model ProspectQueue {
  id           String      @id @default(uuid())
  clientId     String?     @map("client_id")   // Required for tenant isolation
  leadId       String?     @unique @map("lead_id")
  businessName String      @map("business_name")
  websiteUrl   String      @map("website_url")
  status       QueueStatus @default(PENDING)
  attempts     Int         @default(0)
  lastAttemptAt DateTime?  @map("last_attempt_at")
  errorMessage String?     @map("error_message")
  createdAt    DateTime    @default(now()) @map("created_at")
  updatedAt    DateTime    @updatedAt @map("updated_at")

  client Client? @relation(fields: [clientId], references: [id], onDelete: SetNull)
  lead   Lead?   @relation(fields: [leadId], references: [id], onDelete: SetNull)

  @@index([clientId, status])
  @@index([status])
  @@map("prospect_queue")
}
```

On `Client`: `prospectQueues ProspectQueue[]`  
On `Lead`: `prospectQueue ProspectQueue?`

---

## Guardrails

- **No implementation without clientId:** All ProspectQueue and Lead creation in outbound flow must receive and persist `clientId`.
- **TDD:** Failing test before implementation in every phase.
- **Stop for approval:** After Step 02 and before Step 03.
