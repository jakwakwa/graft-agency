---
name: Critical Hardening Plan
overview: "Plan the first three critical hardening issues from the audit: protect public chat, make webhooks durable and replayable, and add basic operational/spend visibility. The implementation is split into small phases so the team can land safety improvements without a rewrite."
todos:
  - id: contracts-schema
    content: Define chat guard, webhook receipt, and operational event contracts plus Prisma schema support.
    status: in_progress
  - id: chat-protection
    content: Implement signed widget tokens, entitlement/origin/rate checks, and chat usage capture.
    status: pending
  - id: webhook-durability
    content: Authenticate Vercel webhook, convert provider webhooks to receipt-first async processors, and add replay controls.
    status: pending
  - id: observability
    content: Add structured operational events, platform metrics read surface, and alert-ready thresholds.
    status: pending
isProject: false
---

# Critical Hardening Implementation Plan

## Problem Frame
The audit identified three urgent risks in the current modular monolith: `/api/chat` is public and model-backed without widget/origin/rate/spend controls, webhook routes process provider events inline without durable receipts or replay semantics, and observability is mostly ad hoc logging with no tenant-level chat cost or webhook lag visibility.

This plan deliberately avoids microservices. It hardens the current Next.js + Prisma + Inngest architecture in manageable phases.

## Scope
- Protect public chat against unauthorised embeds, abusive request volume, unpaid tenant access, and runaway model spend.
- Introduce durable webhook receipt storage, idempotent processing, async handoff, and Vercel webhook authentication.
- Add basic metrics/event capture for chat usage, webhook processing, and pipeline health.
- Defer Redis, full OpenTelemetry/Sentry rollout, vector search, tenant-config caching, and broad schema isolation audits to later roadmap items.

## Current Code To Build On
- Public chat route: [app/api/chat/route.ts](app/api/chat/route.ts)
- Widget transport: [app/widget/[clientId]/_components/chat-widget.tsx](app/widget/[clientId]/_components/chat-widget.tsx)
- Widget server page: [app/widget/[clientId]/page.tsx](app/widget/[clientId]/page.tsx)
- Public route allowlist: [proxy.ts](proxy.ts)
- Tenant/billing fields and workflow schema: [prisma/schema.prisma](prisma/schema.prisma)
- Webhook routes: [app/api/webhooks/paddle/route.ts](app/api/webhooks/paddle/route.ts), [app/api/webhooks/clerk/route.ts](app/api/webhooks/clerk/route.ts), [app/api/webhooks/cal/route.ts](app/api/webhooks/cal/route.ts), [app/api/webhooks/vercel-deploy/route.ts](app/api/webhooks/vercel-deploy/route.ts)
- Inngest registration: [lib/inngest/index.ts](lib/inngest/index.ts), [app/api/inngest/route.ts](app/api/inngest/route.ts)
- Existing tests to extend: [tests/unit/api/chat.route.test.ts](tests/unit/api/chat.route.test.ts), [tests/webhooks/vercel-deploy.test.ts](tests/webhooks/vercel-deploy.test.ts), [tests/unit/webhooks/clerk-organizations.test.ts](tests/unit/webhooks/clerk-organizations.test.ts), [tests/e2e/widget-chat.spec.ts](tests/e2e/widget-chat.spec.ts)

## Phase 1: Contracts And Schema Foundations
Goal: make the hardening behaviour explicit before changing routes.

Implementation units:

- [ ] U1. Define chat access contracts
  - Add a small chat guard layer, likely under [lib/chat/](lib/chat/), responsible for widget token verification, allowed-origin checks, entitlement checks, rate-limit decisions, and quota decisions.
  - Keep `/api/chat` as the caller, not the owner of all guard logic.
  - Test file: `tests/unit/lib/chat/chat-access.service.test.ts`.
  - Test scenarios: valid token and active tenant passes; missing token fails; invalid origin fails when `allowedDomains` is configured; inactive subscription fails except for the platform widget; rate-limit exceeded returns a non-streaming error response.

- [ ] U2. Add durable operational models
  - Extend [prisma/schema.prisma](prisma/schema.prisma) with focused models for `WebhookReceipt`, chat/rate-limit counters, and AI usage/operational events.
  - Use unique constraints for webhook idempotency, such as provider + provider event id, with payload hash as a fallback only where no stable provider id exists.
  - Use tenant-scoped indexes for usage and rate counters.
  - Test file: `tests/unit/db/operational-hardening-schema.test.ts`.
  - Test scenarios: duplicate webhook provider event cannot create duplicate receipts; chat usage rows are tenant-scoped; rate window uniqueness prevents duplicate counters for the same tenant/IP/session/window.

- [ ] U3. Define webhook receipt service contract
  - Add [lib/webhooks/](lib/webhooks/) receipt helpers that can create, claim, mark processed, mark failed, and replay receipts.
  - Keep provider-specific validation in each route, but move durable receipt lifecycle out of the route handlers.
  - Test file: `tests/unit/lib/webhooks/webhook-receipt.service.test.ts`.
  - Test scenarios: first receipt is stored as pending; duplicate receipt is detected and ACK-safe; failed receipt records error metadata; replay only requeues receipts in failed or pending states.

## Phase 2: Public Chat Protection MVP
Goal: reduce the immediate public LLM abuse and unpaid-access risk without introducing new infrastructure.

Implementation units:

- [ ] U4. Sign and pass widget tokens
  - Generate a short-lived signed widget token on [app/widget/[clientId]/page.tsx](app/widget/[clientId]/page.tsx) or the embed loader path, using server-only secret material.
  - Pass the token into [app/widget/[clientId]/_components/chat-widget.tsx](app/widget/[clientId]/_components/chat-widget.tsx) and include it in the `DefaultChatTransport` body or headers.
  - Test files: `tests/unit/widget-token.test.ts`, `tests/e2e/widget-chat.spec.ts`.
  - Test scenarios: widget renders with token; token is scoped to `clientId`; expired/tampered token fails; existing `clientId=platform` behaviour remains supported.

- [ ] U5. Enforce chat guard in `/api/chat`
  - Update [app/api/chat/route.ts](app/api/chat/route.ts) to call the chat guard before model selection, prompt building, tool creation, or conversation persistence.
  - Check `Client.subscriptionActive` / `subscriptionStatus` for tenant widgets, while allowing a narrowly defined platform/demo exception.
  - Validate `Origin`/`Referer` against `Client.allowedDomains` when configured.
  - Use DB-backed rate windows initially because the repo has no Redis/cache layer yet; leave Redis/edge limiting as a later optimisation if metrics show DB contention.
  - Test file: `tests/unit/api/chat.route.test.ts`.
  - Test scenarios: invalid body still returns `400`; unauthorised token returns `401`; inactive subscription returns `402` or agreed entitlement status; rate-limited request returns `429`; valid request still streams and persists conversation; guard failure never calls `streamText`.

- [ ] U6. Record chat usage and quota outcomes
  - Capture per-tenant chat request events, guard denials, model name, session id, approximate message counts, and provider usage metadata when the AI SDK exposes it from the stream finish path.
  - If exact token usage is not available in the current streaming API, persist model/session/request counts now and defer exact token accounting to implementation discovery.
  - Test file: `tests/unit/lib/observability/chat-usage.test.ts`.
  - Test scenarios: successful chat writes usage; denied chat writes guard-denial event without model call; usage failures do not break the chat response.

## Phase 3: Durable Webhook Ingestion
Goal: make provider callbacks idempotent, ACK-safe, replayable, and auditable.

Implementation units:

- [ ] U7. Harden Vercel deployment webhook immediately
  - Update [app/api/webhooks/vercel-deploy/route.ts](app/api/webhooks/vercel-deploy/route.ts) to validate `VERCEL_WEBHOOK_SECRET` using an agreed header or Vercel-supported signature pattern before parsing/processing.
  - Keep deployment matching logic scoped and avoid updating `ProductSpec` before verification.
  - Test file: `tests/webhooks/vercel-deploy.test.ts`.
  - Test scenarios: missing signature rejected; invalid signature rejected; valid deployment-ready payload enqueues/updates as before; non-ready events ACK without mutation.

- [ ] U8. Convert webhooks to receipt-first handlers
  - For Paddle, Clerk, Cal, and Vercel routes, keep signature verification first, then persist a `WebhookReceipt`, then ACK quickly.
  - Move provider-specific business logic into processors invoked asynchronously via Inngest.
  - Files: [app/api/webhooks/paddle/route.ts](app/api/webhooks/paddle/route.ts), [app/api/webhooks/clerk/route.ts](app/api/webhooks/clerk/route.ts), [app/api/webhooks/cal/route.ts](app/api/webhooks/cal/route.ts), [app/api/webhooks/vercel-deploy/route.ts](app/api/webhooks/vercel-deploy/route.ts), [lib/inngest/functions/](lib/inngest/functions/).
  - Test files: `tests/unit/api/webhooks/*.test.ts`, `tests/unit/lib/webhooks/webhook-processors.test.ts`.
  - Test scenarios: valid webhook persists receipt and returns success before processor side effects; duplicate event ACKs without duplicate side effect; invalid signature does not persist; processor failure marks receipt failed.

- [ ] U9. Add replay and failure visibility for receipts
  - Add an admin-only service/API for listing failed/pending receipts and requeueing selected receipts.
  - Scope access through existing platform-owner guards from [lib/auth/resolve-client.ts](lib/auth/resolve-client.ts).
  - Test file: `tests/unit/api/webhook-receipts-admin.test.ts`.
  - Test scenarios: non-platform user cannot list or replay; platform owner can list failed receipts; replay changes state and emits the processing event; processed receipts are not replayed by accident.

## Phase 4: Basic Observability And Spend Visibility
Goal: make the new protections visible enough to operate.

Implementation units:

- [ ] U10. Add structured operational event helpers
  - Add [lib/observability/](lib/observability/) with typed event helpers for chat guard decisions, chat usage, webhook receipt state changes, webhook processor errors, and Inngest handoff failures.
  - Prefer typed payloads over `any`; keep comments and labels in UK English.
  - Test file: `tests/unit/lib/observability/operational-events.test.ts`.
  - Test scenarios: each event type validates required fields; persistence failures are logged without masking the original route/processor outcome.

- [ ] U11. Add a minimal platform ops view or endpoint
  - Add a platform-owner-only read surface for the first useful metrics: chat requests by tenant/day, chat denials by reason, webhook pending/failed counts, oldest pending webhook age, and recent processing errors.
  - If implemented as UI, use shared Typography components from [components/ui/typography](components/ui/typography) and keep components below the 150-line rule.
  - Likely files: `app/(portal)/portal/ops/page.tsx`, `lib/services/ops-metrics.service.ts`, and matching tests.
  - Test scenarios: platform owner sees aggregated metrics; tenant user is denied; empty state renders; failed receipts are included with provider and age.

- [ ] U12. Add alert-ready thresholds without binding to a vendor yet
  - Centralise thresholds for chat error/denial spikes, webhook lag, failed receipts, and tenant spend/request anomalies.
  - Emit structured logs/events that can be wired to Sentry, OpenTelemetry, or Vercel log drains later.
  - Test file: `tests/unit/lib/observability/thresholds.test.ts`.
  - Test scenarios: webhook lag threshold trips; tenant request anomaly trips; normal traffic does not trip; alert checks are deterministic and tenant-scoped.

## Sequencing
1. Land U1-U3 first so the implementation has contracts and schema support.
2. Land U4-U6 next to reduce the highest public abuse and spend risk.
3. Land U7 before or at the start of webhook work because the Vercel route is the sharpest unauthenticated webhook gap.
4. Land U8-U9 to make all webhooks durable and replayable.
5. Land U10-U12 once the new events exist, so the ops view reports real data rather than invented metrics.

## Verification Strategy
- Unit tests first for every new guard, receipt, and observability service.
- Update route tests for `/api/chat` and each webhook handler before changing behaviour.
- Add or update Playwright coverage for the widget flow because token passing crosses server-rendered widget and client chat transport.
- Run targeted tests after each phase, then `bun run test` and `bun run build` before calling the work complete.
- After code edits, use the Next compile verification skill before reporting completion.

## Main Risks
- DB-backed rate limiting can become its own hot path; acceptable as an MVP because no Redis exists, but it should be measured and revisited.
- Widget token/origin enforcement can break existing customer embeds if `allowedDomains` data is incomplete; ship with clear migration behaviour and a platform/demo exception.
- Webhook async handoff changes ACK semantics; tests must prove duplicate and failure paths before replacing inline handlers.
- Exact token/spend accounting may depend on AI SDK streaming metadata; if unavailable, capture request/model/session counts first and explicitly defer exact token precision.