---
 2026-05-01 - Graft Today Review Audit & Verdict
---

# Cursor Council Review Verdict

## Verdict

The council review is directionally correct, but a few claims need sharpening.
True from code:

* Modular monolith + Inngest workflows: `app/api/inngest/route.ts`, `lib/inngest/index.ts`.
* Multi-tenant SaaS shape: `Client`, `AgentConfig`, `Lead`, `Conversation`, `ProductSpec` in `prisma/schema.prisma`.
* Public chat abuse/cost risk: `/api/chat` is public in `proxy.ts`, accepts `clientId` from the request, and has no rate limit, quota, origin validation, or widget token.
* Vendor concentration is high: Clerk, Paddle, Gemini, Inngest, Stitch, Jules, Render, [Cal.com](http://Cal.com), Resend, Prisma/Postgres.
* Caching and observability are underdeveloped: no Redis/cache layer, no metrics/SLO/Sentry/OTel found.
* KB storage is simple JSON substring search: `AgentConfig.knowledgeBase` and `agentService.searchKnowledge`.
Debatable / partially true:
* Tenant isolation exists mostly through `clientId` query scoping, but not schema/RLS-enforced everywhere; some tenant-owned relations are optional.
* Billing state exists, but chat/widget access does not appear gated by `subscriptionActive` or `subscriptionStatus`.
* Async durability is better than the review implies: there are `stageVersion`, `StageTransition`, Inngest idempotency, and unique intent keys.
* 10x scaling pain is plausible, but not provable without runtime traffic, DB, queue, and spend metrics.
Untrue / unsupported:
* “Webhook ingestion is durable/replayable” is false. Clerk/Paddle/Cal verify signatures, but there is no webhook receipt table and handlers process inline before ACK.
* Vercel deploy webhook hardening is false. `.env.example` documents `VERCEL_WEBHOOK_SECRET`, but `app/api/webhooks/vercel-deploy/route.ts` does not validate it.
* Formal public API contracts are not present. I found route-local Zod validation, not OpenAPI/versioned contracts.
* Full observability/SLO discipline is not present in code.

## Roadmap Implication

The next engineering roadmap should prioritise:

1. Protect `/api/chat`: widget token/origin binding, tenant/IP/session rate limits, quotas, and entitlement checks.
2. Add durable webhook receipts + async processing + replay tooling.
3. Add metrics/SLOs/spend tracking, especially chat cost per tenant and webhook lag.
4. Tighten schema constraints: tenant ownership, dedupe fingerprints, external IDs, idempotency records.
5. Cache hot tenant config/widget reads before considering service splits.
Changed file: the canvas only. Verification: `ReadLints` reported no linter errors for the canvas; I did not run app tests because no application code was changed.

# Audit routes and endpoints

# Audit routes and endpoints

## Evidence

## Next.js App Router and API routes

**Route handlers (****`app/api/**/route.ts`****) — 23 files**

| Path | Symbols / notes |
| ---| --- |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/chat/route.ts` | `POST` — Zod `chatRequestSchema` (`clientId`, `messages`, `sessionId`), `streamText`, `stepCountIs(5)`, `createTools(clientId)` |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/embed/[clientId]/route.ts` | `GET` — returns loader JS; iframe → `/widget/${clientId}` |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/webhooks/clerk/route.ts` | `POST` — Svix `Webhook.verify` |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/webhooks/cal/route.ts` | `POST` — `cal-signature` + HMAC `timingSafeEqual` |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/webhooks/paddle/route.ts` | `POST` — `paddle-signature` + `verifyPaddleSignature` |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/webhooks/vercel-deploy/route.ts` | `POST` — parses JSON; no signature check |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/inngest/route.ts` | `GET`, `POST`, `PUT` — `serve({ client: inngest, functions: [...] })` (8 functions) |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/cron/prospecting/route.ts` | `GET` — `Authorization: Bearer` vs `CRON_SECRET`, `timingSafeEqual` |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/leads/route.ts` | `GET` — `requirePlatformAccess()`, tenant-scoped queries |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/leads/[id]/route.ts` | `GET`/`PATCH`/`DELETE` — `findFirst({ id, clientId })` |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/leads/[id]/approve/route.ts` | `POST` — `findFirst({ id, clientId, source: ... })` |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/engagement/status/[leadId]/route.ts` | `GET` — `requirePlatformAccess()` then loads spec by `leadId` only (no `clientId` filter on lead/spec in snippet read) |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/engagement/trigger/[leadId]/route.ts` | `POST` — `requirePlatformAccess()` then `lead.findUnique({ id: leadId })` without `clientId` match |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/engagement/proxy-image/route.ts` | `GET` — `requirePlatformAccess()`, host allowlist for Google User Content |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/automation/find-prospects/route.ts` | `POST` — `requirePlatformAccess()` |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/prospect-queue/route.ts` | `GET`/`POST` — `requirePlatformAccess()` + Zod |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/prospect-queue/[id]/route.ts` | `PATCH`/`DELETE` — scoped `{ id, clientId }` |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/prospect-queue/upload/route.ts` | `POST` — `requirePlatformAccess()` + CSV limits |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/prospecting-config/route.ts` | `GET`/`POST` — `requirePlatformAccess()` + Zod |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/billing/portal/route.ts` | `GET` — `auth()` + Paddle portal |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/billing/addons/route.ts` | `POST` — `auth()` + Zod |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/admin/clients/route.ts` | `POST` — `resolveClientIdFromAuth()` + must equal `getPlatformClientId()` |
| `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/me/client-flags/route.ts` | `GET` — `resolveClientIdFromAuth()` |

**UI surfaces**

* `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/widget/[clientId]/page.tsx` — server loads `agentService.getConfig(clientId)`; renders `ChatWidget`.
* `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/widget/[clientId]/_components/chat-widget.tsx` — `useChat` → `api: "/api/chat"`, `body: { clientId, sessionId }` (lines 35–39).

**Other pages (route groups)** — e.g. `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/page.tsx`, `app/(marketing)/dashboard/**`, `app/(portal)/portal/**` (glob listed 19 `page.tsx` files).
* * *

## Auth / middleware (important discrepancy)

* **`/Users/jacobkotzee/Repos/saas/graft-today-agency/proxy.ts`** — `clerkMiddleware` + `createRouteMatcher` marks these as **public** (no `auth.protect()`): `/`, `/privacy`, `/terms`, **`/api/chat`**, **`/api/embed/(.*)`**, **`/api/webhooks/(.*)`**, **`/api/cron/(.*)`**, **`/api/inngest`**, **`/widget/(.*)`** (lines 3–18).
* **Glob search found zero** **`middleware.ts`** under the repo; internal docs/plan note Next expects `middleware.ts`, not `proxy.ts` only

(e.g. `.cursor/plans/automation_dashboard_wire-up_ff19e69a.plan.md`, `docs/living-sop.md` references `proxy.ts`).

**Evidence implication:** protection behaviour depends on whether production actually renames/copies this file to `middleware.ts` outside the tracked tree; **in-repo source does not show a standard Next middleware entry file.**

**Per-route auth patterns**

* **`requirePlatformAccess()`**: automation/leads/prospect-queue/engagement proxy-image, etc. (`/Users/jacobkotzee/Repos/saas/graft-today-agency/lib/auth/resolve-client.ts` ~103–117).
* **`auth()`** **only**: billing routes.
* **Cron**: secret bearer in `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/cron/prospecting/route.ts`.

**Conversation persistence / session binding**

* `/Users/jacobkotzee/Repos/saas/graft-today-agency/lib/services/conversation.service.ts` — `save()` rejects update if existing row’s `clientId !== input.clientId` (lines 17–24).

* * *

## Classifying typical architectural-review claims

| Claim theme | Verdict | Why (from code) |
| ---| ---| --- |
| Public chat abuse risk | Supported | `/api/chat` is explicitly treated as public in `proxy.ts` (lines 7–8); handler has validation and tool step cap (`stepCountIs(5)` in `app/api/chat/route.ts` 63–71) but no visible auth or rate limiting on the route; widget/embed advertise `clientId` in URLs and loader (`embed` + `widget`). Abuse surface = unauthenticated LLM + tools + DB writes via conversation save. |
| Webhook hardening | Debatable / partly supported | Strong verification on Clerk (Svix), Cal, Paddle (file paths above). Weak: `vercel-deploy` accepts JSON with no HMAC/signature check (`app/api/webhooks/vercel-deploy/route.ts`). Inngest: SDK `serve` + `signingKey` on client (`lib/inngest/client.ts` 28–29) — standard pattern, not audited line-by-line here. |
| API contract clarity | Debatable | Several handlers use Zod (`chat`, `prospect-queue`, `prospecting-config`, `billing/addons`, `leads/[id]` patch). Others rely on casts (e.g. `vercel-deploy` body typing). Tenant consistency is uneven: `leads/[id]` scopes by `clientId`; `engagement/trigger` and `engagement/status` load by `leadId` without showing an explicit `clientId` ownership check in the reviewed code — that affects both security narrative and “clear contracts”. |
| Workload concentration | Supported | Single Inngest HTTP surface registers many workflows (`app/api/inngest/route.ts` 14–26). Chat funnels streaming AI work through one `POST /api/chat`. Cron centralises scheduled prospecting (`app/api/cron/prospecting/route.ts`). Engagement orchestration is heavily Inngest-centric (`lib/inngest/functions/*`). |

* * *

## File index (absolute paths for quick navigation)

* Middleware intent: `/Users/jacobkotzee/Repos/saas/graft-today-agency/proxy.ts`
* Public chat API: `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/chat/route.ts`
* Embed loader: `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/embed/[clientId]/route.ts`
* Widget UI: `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/widget/[clientId]/page.tsx`, `.../_components/chat-widget.tsx`
* Webhooks: `.../app/api/webhooks/{clerk,cal,paddle,vercel-deploy}/route.ts`
* Inngest: `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/inngest/route.ts`, `/Users/jacobkotzee/Repos/saas/graft-today-agency/lib/inngest/client.ts`
* Auth helpers: `/Users/jacobkotzee/Repos/saas/graft-today-agency/lib/auth/resolve-client.ts`
* Conversation tenant guard: `/Users/jacobkotzee/Repos/saas/graft-today-agency/lib/services/conversation.service.ts`

* * *

**Note:** `updateCurrentStep` failed with a JSON error in this environment; the audit above is complete without that UI update.

**Summary:** The repo has a clear App Router API layout with identifiable public chat/embed/widget surfaces and mixed webhook verification (strong on Clerk/Cal/Paddle, absent on Vercel deploy). Middleware protection is **documented and implemented in** **`proxy.ts`**, but **there is no** **`middleware.ts`** **in-tree**, which matters when judging whether review claims about “middleware protects everything except listed public routes” match **committed** code. Engagement APIs show **weaker tenant scoping** than `leads/[id]`, so claims about uniform API contract or isolation are **only partly supported**.

# Audit summary: GRAFT TODAY

## Audit summary: `/Users/jacobkotzee/Repos/saas/graft-today-agency`

### Inngest / event workflows (**supported**)

* **Serve endpoint**: `app/api/inngest/route.ts` registers `serve({ client: inngest, functions: [...] })` for `GET/POST/PUT` (lines 14–26).
* **Client**: `lib/inngest/client.ts` (`Inngest` id `graft-agency`, `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY`, Vercel `isDev: false` guard) — lines 24–31.
* **Functions** (under `lib/inngest/functions/`): `prospecting-tick`, `lead-profiler`, `prd-writer`, `stitch-designer`, `jules-builder`, `jules-poller`, `offer-dispatcher`, `engagement-reconciler` — re-exported via `lib/inngest/index.ts` and wired in the route above.
* **Event graph (code references)**:
  * `engagement/lead.approved` — `app/api/leads/[id]/approve/route.ts` (55–58), `app/api/engagement/trigger/[leadId]/route.ts` (18–19).
  * Chain: `lead-profiler` → `engagement/lead.profiled` (106–108); `prd-writer` → `engagement/prd.written` (grep); `stitch-designer` → `engagement/design.completed`; `jules-builder` → `engagement/build.started`; `jules-poller` → `engagement/build.poll.tick` (80–88, 98–105); `vercel-deploy` webhook → `engagement/deployment.ready` (`app/api/webhooks/vercel-deploy/route.ts` 33–34); failures → `engagement/reconcile.requested` in `lib/inngest/functions/_shared/on-failure.ts` (48–55).
* **Clerk + Inngest**: `proxy.ts` allowlists `/api/inngest` (lines 3–12) so the serve path is public alongside `/api/webhooks/(.*)` and `/api/cron/(.*)`.

**Path drift (evidence, not a claim):** `scripts/inngest-dev-serve.ts` points dev sync at `${base}/api/graft-today/inngest` (lines 9–11) while the real route is `app/api/inngest/route.ts` → `/api/inngest`. Older doc `docs/solutions/integration-issues/inngest-prospecting-scheduler-replaces-vercel-cron-20260328.md` mentions `/api/kona/inngest` — not present in the current serve file.
* * *

### Cron / reconcilers (**supported**)

* **Vercel cron**: `vercel.json` has `"crons": []` (empty) — aligns with `docs/living-sop.md` note that scheduling is via Inngest.
* **HTTP cron fallback**: `app/api/cron/prospecting/route.ts` — `CRON_SECRET` Bearer check + `runProspectingScheduledJob` (from grep + file existence).
* **Inngest cron**: `lib/inngest/functions/prospecting-tick.ts` — `triggers: [{ cron: "*/15 * * * *" }]` (grep).
* **Reconciler**: `lib/inngest/functions/engagement-reconciler.ts` — `triggers: [{ cron: "*/15 * * * *" }, { event: "engagement/reconcile.requested" }]` (lines 38–45); scheduled fan-out of per-lead events (lines 47–70); on-read nudge in `app/api/engagement/status/[leadId]/route.ts` (fire `engagement/reconcile.requested` when stale — grep).

* * *

### External integrations (**supported**, by symbol / path)

| Provider | Where |
| ---| --- |
| Clerk | `proxy.ts`; `@clerk/nextjs` in layout/components; server `auth` / `clerkClient` in `lib/auth/resolve-client.ts`, dashboard members, billing routes (grep hits). |
| Paddle | `lib/paddle.ts` (SDK singleton); `app/api/webhooks/paddle/route.ts`; `lib/services/offer.service.ts`; `lib/webhooks/clerk-organizations.ts` (create customer); `offer-dispatcher` step `create-paddle-transaction`. |
| Gemini | `@google/genai` in `lib/inngest/functions/lead-profiler.ts`, `prd-writer.ts`, `lib/services/gemini-prospecting.service.ts`; Vercel AI `google(...)` in `lib/ai/model-router.ts`. |
| Stitch | `@google/stitch-sdk` via `lib/engagement/stitch-design-concepts.ts`; `lib/inngest/functions/stitch-designer.ts`. |
| Jules | `lib/services/jules-github.service.ts` (`jules.googleapis.com`); used by `jules-builder`, `jules-poller`, `idempotency.ts`, reconciler. |
| Render | `lib/services/render.service.ts`; `ensureRenderService` in `lib/engagement/idempotency.ts`. |
| Resend | `lib/services/offer.service.ts` (`Resend`, `emails.send`). |
| [Cal.com](http://Cal.com) | `lib/services/cal.service.ts` (`api.cal.com/v2`); webhook `app/api/webhooks/cal/route.ts` (HMAC `cal-signature`). |
| Vercel deploy | `app/api/webhooks/vercel-deploy/route.ts` → `inngest.send` `engagement/deployment.ready`. |

**Render / Jules / Stitch** are all present in code; **“Jules”** is Google’s API, not a separate “Render” product name confusion.
* * *

### Retry / idempotency / errors (**supported**, partial)

* **Inngest retries**: e.g. `jules-poller` `retries: 5`, `concurrency: { limit: 5 }` (`lib/inngest/functions/jules-poller.ts` 35–41); `lead-profiler` `retries: 3`, `idempotency: "event.data.leadId"` (74–81); `offer-dispatcher` `retries: 2`, idempotency (11–18); reconciler `retries: 3`, keyed concurrency (38–44).
* **Approval race**: `app/api/leads/[id]/approve/route.ts` — transaction with `FOR UPDATE`, upsert spec, emit `engagement/lead.approved` only when `pipelineStarted` (lines 23–59).
* **Jules / Render idempotency**: `lib/engagement/idempotency.ts` — `ensureJulesSession`, `ensureRenderService` with intent keys and recovery paths (lines 16–145); comment on Inngest retry + unique violation (lines 56–57).
* **Failure semantics**: `makeOnFailure` updates `inngestRunStatus: "Failed"` and triggers reconcile; **does not** set stage to `FAILED` (lines 13–15, 38–55 in `on-failure.ts`).

* * *

### Caching (**mostly unsupported** as app-level HTTP/Redis cache)

* No meaningful use of `unstable_cache` / `revalidateTag` in app code (only `types/cache-life.d.ts` reference).
* Local UI cache: `components/ai-elements/code-block.tsx` in-memory `tokensCache` (syntax highlighting) — not API caching.
* **Debatable:** Throttling in `lib/engagement/reconcile-throttle.ts` acts as _rate limiting_ for Jules fetches, not a read-through cache.

* * *

### Observability / logging / SLOs (**supported gap**)

* **No** `instrumentation.ts`, and **no** Sentry/OTel/Datadog-style deps found in `package.json` grep for those strings.
* **Patterns seen:** `console.error` in webhooks (`app/api/webhooks/clerk/route.ts`, `paddle`, `lib/webhooks/clerk-organizations.ts`).
* **Ad hoc debug I/O:** `lib/services/cal.service.ts` — `appendFileSync` to `.cursor/debug-0b2dc2.log` in `dbg()` (lines 1–14, 38–45, 83–89) — not production observability.
* **SLOs:** No code-level SLO/error budget; durable runs visible via Inngest + DB fields (`inngestRunId`, `inngestRunStatus` in `on-failure.ts`).

* * *

### Cost tracking (**unsupported** in product sense)

* No aggregation of Gemini token usage, Stitch/Jules call counts, or per-tenant AI spend in the reviewed paths.
* **Revenue-side:** Paddle transactions/subscriptions and webhooks exist; that is **billing**, not **AI cost accounting**.

* * *

### Classifying common architectural review claims

| Claim | Verdict | Why |
| ---| ---| --- |
| Event-driven workflows (Inngest orchestration) | Supported | Multiple `createFunction` handlers, event chaining, cron + event triggers, webhooks emitting events. |
| Vendor concentration (many third parties in one pipeline) | Supported | Clerk, Paddle, Resend, Cal, Google GenAI/Stitch/Jules, GitHub (via Jules service), Render, Vercel webhooks all appear in the engagement/prospecting paths. |
| Polling bottlenecks (Jules / status) | Debatable | Supported that polling exists: `jules-poller` `step.sleep` 60s + self-requeue (`jules-poller.ts` 28–33, 59–105); reconciler + on-read reconcile. Whether that is a “bottleneck” vs intentional backoff is product/runtime judgment; code also throttles reconciler Jules fetches (`reconcile-throttle.ts`, `engagement-reconciler.ts` 151–157). |
| Observability gaps | Supported | Structured APM/metrics absent; mainly `console.error` and one local file debug logger for Cal. |
| Provider abstraction | Debatable | Partial: dedicated modules (`lib/paddle.ts`, `cal.service.ts`, `jules-github.service.ts`, `render.service.ts`, `gemini-prospecting.service.ts`) vs tight coupling in Inngest steps (direct Prisma + service calls). Not a uniform ports/adapters layer across all AI providers. |
| Cost accounting (AI usage / unit economics) | Unsupported | No token/metering layer found; Paddle covers commercial transactions, not model cost. |

* * *

**Files worth citing as the “spine” of this audit:**
`app/api/inngest/route.ts`, `lib/inngest/client.ts`, `lib/inngest/functions/*.ts`, `lib/engagement/idempotency.ts`, `lib/engagement/reconcile-throttle.ts`, `proxy.ts`, `vercel.json`, `app/api/leads/[id]/approve/route.ts`, `lib/services/{cal,jules-github,render,gemini-prospecting}.service.ts`, `lib/paddle.ts`, `lib/services/offer.service.ts`, `app/api/webhooks/{clerk,paddle,vercel-deploy,cal}/route.ts`.

# Multi-tenancy and isolation

## Multi-tenancy and isolation

**Evidence**

* **`Client`** is the tenant root with relations to `AgentConfig`, `Conversation`, `Lead`, `ProductSpec`, etc. (`prisma/schema.prisma` models `Client` … `@@map("clients")`).
* **`Lead.clientId`** and **`EmailTemplate.clientId`** are optional (`String?`), so the schema allows tenant-less rows (`Lead` lines 83–104; `EmailTemplate` 127–139).
* **Conversation** requires `clientId`; **`conversationService.save`** loads by global `sessionId`, then rejects updates if `clientId` mismatches (`lib/services/conversation.service.ts` ~16–33).
* **Scoped API example**: `PATCH /api/leads/[id]` uses `findFirst({ where: { id, clientId } })` before update (`app/api/leads/[id]/route.ts` ~38–58).

**Classification**

* **Strong Postgres-level tenant isolation (e.g. RLS):** **Unsupported** by schema/code reviewed — no RLS; isolation is application-layer where enforced.
* **Deliberate tenant scoping in services:** **Supported** for conversations and several routes; **Debatable** overall because optional `clientId` and some updates key only by `leadId` / external ids (see below).

* * *

## Workflow state, versioning, audit

**Evidence**

* **`ProductSpec`**: `EngagementStage stage`, `stageVersion`, failure/reconciliation/Inngest metadata, unique intent keys (`stitch_run_intent_key`, `jules_session_intent_key`, `render_service_intent_key`) (`prisma/schema.prisma` ~158–205).
* **`transitionStage`**: optimistic concurrency via `expectedStageVersion`, increments `stageVersion`, appends **`StageTransition`** (`lib/engagement/stage-machine.ts` ~45–98).
* Migration adds durability columns and **`stage_transitions`** index `(lead_id, created_at)` (`prisma/migrations/20260423000000_engagement_durability/migration.sql`).

**Classification**

* **Workflow state + constraints/indexes for orchestration:** **Supported**.

* * *

## Idempotency (non-webhook)

**Evidence**

* **Inngest** functions use `idempotency: "event.data.leadId"` (e.g. `lib/inngest/functions/jules-builder.ts`, `lead-profiler.ts`, `prd-writer.ts`, `offer-dispatcher.ts` — grep hits).
* **Jules / Render provisioning**: intent keys on `ProductSpec` + recovery paths (`lib/engagement/idempotency.ts`; unique indexes in migration above).

**Classification**

* **Orchestration / side-effect idempotency for engagement:** **Supported** (Inngest keys + DB intent columns).
* **Postgres “single generic idempotency table”:** **Unsupported** — no such model in `schema.prisma`.

* * *

## Webhook receipt persistence

**Evidence**

* **Clerk / Paddle / Cal** routes verify signatures and call handlers; **Paddle** updates `client` / `productSpec` by ids from payload (`app/api/webhooks/paddle/route.ts` ~45–124, ~132–191).
* No **`WebhookEvent`**, **`processed_webhooks`**, or **`event_id`** model appears in `schema.prisma`.

**Classification**

* **Durable webhook idempotency / replay-safe receipt log in Postgres:** **Unsupported** by schema — retries could re-run handlers unless each mutation is naturally idempotent or the provider dedupes.

* * *

## Lead deduplication

**Evidence**

* **`loadCrmExclusionSets`**: loads all leads for `clientId`, builds normalized name/url sets (`lib/services/gemini-prospecting.service.ts` ~53–78).
* **Loop**: in-batch sets + CRM exclusion; **`prisma.lead.create`** only; duplicates skipped in app logic (`~304–358`).
* **No** `@@unique([clientId, …])` on normalized identity in `Lead`.

**Classification**

* **App-layer dedupe for outbound prospecting:** **Supported**.
* **DB-enforced dedupe:** **Unsupported** — races or bypass paths can still insert duplicates.

* * *

## Transcript / message storage

**Evidence**

* **`Conversation.messages`**: required `Json` (`prisma/schema.prisma` ~142–155).
* **`Lead.chatTranscript`**: optional `Json` (`Lead` ~91–92); Cal cancellation merges into `chatTranscript` (`app/api/webhooks/cal/route.ts` ~58–69).
* **`calBookingUid`**: `@unique` on `Lead` (~93); Cal webhook finds lead by it (~48–50). **`cal.service.createBooking`** returns `bookingUid` but **no** `prisma.lead.update` with `calBookingUid` appears in the repo grep — linkage from booking API → DB field looks **missing**, so cancellation webhook may often hit “Lead not found”.

**Classification**

* **Monolithic JSON for transcripts/messages:** **Supported** by schema.
* **Scalability (partitioning, per-message rows, FTS):** **Unsupported** in schema — **Debatable** as risk (depends on volume); architecturally typical concern for large blobs / hot rows.
* **Cal booking ↔** **`calBookingUid`** **persistence:** **Unsupported** by current code paths found (field exists; population not found).

* * *

## Knowledge / JSON storage

**Evidence**

* **`AgentConfig.knowledgeBase`** `Json?` (`prisma/schema.prisma` ~70).
* **`agentService.searchKnowledge`**: loads config, treats `knowledgeBase` as array, **in-memory** substring filter (`lib/services/agent.service.ts` ~70–96).
* **`ProspectingConfig.searchCriteria`** `Json?` (~51).

**Classification**

* **KB as JSON + naive search:** **Supported** — fine for small corpora; **Debatable / weak for scale** (no vector index, no pagination/streaming in DB).

* * *

## Indexes (high level)

**Evidence** (declared on models in `schema.prisma`):
`Client`: `[subdomain]`, `[isPlatformOwner]`, `[deletedAt]`, `[clerkUserId]` (~39–42).
`Lead`: `[clientId, status]`, `[status]` (~102–103).
`ProspectQueue`: `[clientId, status]`, `[status]` (~122–123).
`Conversation`: `[clientId]`, `[sessionId]` (~153–154) plus `@unique sessionId` (~147).
`ProductSpec`: `[clientId, stage]`, `[leadId]`, `[stage, updatedAt]` (~203–205).
`StageTransition`: `[leadId, createdAt]` (~221).

**Classification**

* **Claim “reasonable indexing for common filters”:** **Supported**.
* **Claim “every hot query path is optimally indexed”:** **Debatable** without workload traces.

* * *

## Postgres “hotspot” risk

**Evidence**

* Frequent **`productSpec.update`** from Inngest/reconciler/poller/stage machine (grep hits under `lib/inngest/`, `lib/engagement/`).
* **`conversation.update`** replaces entire **`messages`** JSON (`lib/services/conversation.service.ts` ~26–31).

**Classification**

* **Central tables (****`product_specs`****,** **`conversations`****) can become write-heavy per active lead/session:** **Supported** as an architectural observation.
* **Proven production hotspot:** **Debatable** — requires metrics; not contradicted by schema.

* * *

## Summary table (review claims vs repo)

| Topic | Verdict |
| ---| --- |
| Postgres hotspot / hot rows on orchestration + chat | Supported as plausible; severity Debatable |
| Strong DB-enforced tenant isolation | Unsupported (app-layer + gaps) |
| Schema constraints, workflow indexes, stage audit | Supported |
| Webhook receipt / idempotency tables | Unsupported |
| Lead dedupe | Supported (app); DB uniqueness Unsupported |
| Transcript/KB scalability | Debatable; monolithic JSON Supported |
| `calBookingUid` wired end-to-end | Unsupported (persist step not found) |

**Primary files**

* `/Users/jacobkotzee/Repos/saas/graft-today-agency/prisma/schema.prisma` — models, Json columns, indexes, uniques.
* `/Users/jacobkotzee/Repos/saas/graft-today-agency/prisma/migrations/20260423000000_engagement_durability/migration.sql` — durability + `stage_transitions`.
* `/Users/jacobkotzee/Repos/saas/graft-today-agency/lib/services/conversation.service.ts` — tenant check on `sessionId`.
* `/Users/jacobkotzee/Repos/saas/graft-today-agency/lib/services/gemini-prospecting.service.ts` — CRM + batch dedupe.
* `/Users/jacobkotzee/Repos/saas/graft-today-agency/lib/services/agent.service.ts` — KB search over JSON.
* `/Users/jacobkotzee/Repos/saas/graft-today-agency/lib/engagement/stage-machine.ts` — stage versioning + audit rows.
* `/Users/jacobkotzee/Repos/saas/graft-today-agency/lib/engagement/idempotency.ts` — intent keys for Jules/Render.
* `/Users/jacobkotzee/Repos/saas/graft-today-agency/app/api/webhooks/paddle/route.ts`, `.../cal/route.ts` — no receipt persistence; direct updates.
