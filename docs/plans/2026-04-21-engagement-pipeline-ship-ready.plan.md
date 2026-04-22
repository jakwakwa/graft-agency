# Engagement Pipeline — Ship-Ready Plan

## Context

The 8-stage engagement pipeline (PENDING → PROFILING → WRITING_PRD → DESIGNING → BUILDING → DEPLOYING → DEPLOYED → OFFER_SENT) is wired end-to-end via Inngest + Gemini + Stitch + Jules + GitHub + Vercel + Paddle + Resend. A stepper UI at `/dashboard/automation/queue/[id]` already polls stage status every 15s.

**First-ship goal:** validate the LLM-driven stages + Jules build-agent stage end-to-end against a synthetic lead using **real Gemini + Stitch + Jules** (Jules requires a real GitHub repo created from template, so GitHub repo creation stays real). Stub **Vercel deploy, Paddle, Resend** so no site goes live, no billing product is created, no email is sent. The user wants to see profiled needs + PRD + design concepts + a real Jules-built repo for a fake company before trusting the pipeline further.

Subdomain/hosting work (`{slug}.graft.today` via Vercel Domains API) is **deferred to a later milestone**; it's the most complex piece and not needed to gain confidence in the LLM stages.

Decisions locked:
- Dry-run = **synthetic lead, real Gemini + Stitch + Jules (+ GitHub repo), stubbed Vercel deploy + Paddle + Resend**.
- Artifact preview needed in UI: **PRD markdown + design concepts** (plus profiled needs for context, plus the Jules repo/issue links already surfaced).
- Offer gate work also deferred — pipeline stops via stub at the Vercel-deploy boundary, not via human approval, for the first run.

## Phased Approach

### Phase 1 — Artifact visibility (1–2 days)

Make PRD + design concepts + profiled needs readable in the dashboard. No pipeline logic changes.

**Changes:**
- [app/api/engagement/status/[leadId]/route.ts](app/api/engagement/status/[leadId]/route.ts) — return full `profiledNeeds`, `prdContent`, `designConcepts` payloads (currently only summarised). Auth-gated.
- [app/(marketing)/dashboard/automation/queue/[id]/_components/engagement-panel.tsx](app/(marketing)/dashboard/automation/queue/[id]/_components/engagement-panel.tsx) — add collapsible sections under the stepper:
  - **Profiled needs**: render JSON as readable key/value cards (pain points, ICP fit, signals).
  - **PRD preview**: render `prdContent` with a markdown renderer (check if `react-markdown` or an existing prose component is already in the repo before adding a dep).
  - **Design concepts**: 3-up grid showing concept name + image/link per concept.
- No schema change. No new API routes.

### Phase 2 — Stub deploy/billing/email + dry-run harness (1 day)

Let PROFILING → WRITING_PRD → DESIGNING → BUILDING run with real services (Jules will actually create a GitHub repo from template and post a build issue). Prevent Vercel deploy, Paddle, and Resend from firing.

**Stub strategy:** env flag `ENGAGEMENT_DRY_RUN=true`. When on:
- [lib/inngest/functions/jules-builder.ts](lib/inngest/functions/jules-builder.ts) — **no change**. Runs real GitHub repo creation + Jules issue post as usual.
- [app/api/webhooks/vercel-deploy/route.ts](app/api/webhooks/vercel-deploy/route.ts) — no change needed for the dry-run itself, but in dry-run mode Jules's repo should not be auto-linked to a Vercel project (configure the repo template to omit the Vercel GitHub integration, **or** skip Vercel project creation in the builder). Simplest: the template repo is already not connected to any Vercel project, so no deploy webhook fires automatically → stage halts naturally at `BUILDING_COMPLETE`.
- [lib/inngest/functions/offer-dispatcher.ts](lib/inngest/functions/offer-dispatcher.ts) — early return if `ENGAGEMENT_DRY_RUN=true` (defensive; shouldn't be reached because no `deployment.ready` event fires without Vercel).
- If the current flow auto-creates a Vercel project inside `jules-builder`, gate that creation behind `!ENGAGEMENT_DRY_RUN`.

**Verify before shipping:** audit `jules-builder.ts` for any Vercel API calls and confirm the template repo has no Vercel GitHub app pre-linked. If it does, the dry-run flag must skip the project-link step.

**Dry-run harness:** `scripts/dry-run-engagement.ts` (Bun):
1. Insert synthetic `Lead` row (fake company, fake signals, deterministic name like `dry-run-<timestamp>`).
2. Fire `engagement/lead.approved` via Inngest client.
3. Poll `/api/engagement/status/[leadId]` until stage is `BUILDING_COMPLETE` or `FAILED`, printing each transition.
4. Print the dashboard URL for manual artifact inspection.
5. Provide a `--cleanup` flag to delete the synthetic lead + associated `ProductSpec`.

## Files to Modify

| File | Change |
|---|---|
| [app/api/engagement/status/[leadId]/route.ts](app/api/engagement/status/[leadId]/route.ts) | Return full artifact payloads |
| [app/(marketing)/dashboard/automation/queue/[id]/_components/engagement-panel.tsx](app/(marketing)/dashboard/automation/queue/[id]/_components/engagement-panel.tsx) | Collapsible sections for needs, PRD, designs |
| [lib/inngest/functions/jules-builder.ts](lib/inngest/functions/jules-builder.ts) | Gate any Vercel-project-link step behind `!ENGAGEMENT_DRY_RUN`; Jules + GitHub calls run as normal |
| [lib/inngest/functions/offer-dispatcher.ts](lib/inngest/functions/offer-dispatcher.ts) | Defensive dry-run early return |
| `scripts/dry-run-engagement.ts` *(new)* | Synthetic lead harness |
| `.env` / env docs | Document `ENGAGEMENT_DRY_RUN` |

## Verification

1. **Setup**: set `ENGAGEMENT_DRY_RUN=true` in local env. Confirm Gemini + Stitch API keys are live.
2. **Run**: `bun scripts/dry-run-engagement.ts`.
3. **Watch stepper** at `/dashboard/automation/queue/[id]` (URL printed by script): stages advance PENDING → PROFILED → PRD_WRITTEN → DESIGN_COMPLETE → BUILDING_COMPLETE, then halts (no DEPLOYING/DEPLOYED because Vercel is not triggered).
4. **Inspect artifacts** in the expanded panel:
   - Profiled needs JSON is coherent for the fake company.
   - PRD markdown reads as a real PRD (problem, audience, features).
   - 3 design concepts render with distinct names.
   - Jules-built GitHub repo link opens a real repo with committed scaffold; Jules issue link shows real build activity.
5. **Confirm no unwanted side effects**: GitHub repo exists (expected), but no Vercel project, no Paddle product, no Resend email.
6. **Cleanup**: `bun scripts/dry-run-engagement.ts --cleanup` (deletes synthetic Lead + ProductSpec rows). The GitHub repo Jules created is kept by default — delete it manually from the GitHub org after inspection, or extend the cleanup script to call the GitHub delete API.
7. **Iterate**: re-run with tweaked fake-company inputs to stress-test prompts.

## Deferred (explicitly out of scope for this ship)

- Vercel deploy of the Jules-built repo.
- Subdomain assignment on `{slug}.graft.today` via Vercel Domains API.
- Human approval gate before OFFER_SENT.
- Paddle product creation + Resend offer email.
- Attio bi-directional stage sync.

Tackle these after the LLM-stage dry-run is clean and prompts are tuned.