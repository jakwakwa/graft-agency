# Engagement Queue Accuracy, Jules Poll Cadence, Design Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix misleading “Inngest: Failed” UI while Jules is still building, slow status/Jules polling to 5 minutes only during `BUILDING`, replace alarmist orchestrator copy with accurate messaging, and make Stitch/Google design preview images load reliably (mitigate 429 / config issues).

**Architecture:** Treat `productSpec.inngestRunStatus === "Failed"` from `makeOnFailure` as a *signal about the last Inngest function run*, not ground truth for an active Jules session. When `stage === "BUILDING"` and Jules API-derived state is non-terminal, the dashboard derives a **display** status so the badge is not destructive. Slow **only** the Jules poller sleep (`jules-poller.ts`) and the queue detail **client** refetch interval when `stage === "BUILDING"`, leaving other stages at the current ~10s cadence. For images: correct `remotePatterns.hostname`, add `referrerPolicy="no-referrer"` (and lazy loading) on preview images to reduce hotlink-style blocks; keep `unoptimized` to avoid the optimizer hammering Google’s CDN.

**Tech stack:** Next.js App Router, React client components, Inngest (`lib/inngest/functions/jules-poller.ts`, `engagement-reconciler.ts`), Prisma `productSpec`, Vitest, `next/image`.

---

## File structure (creates / modifies)

| File | Responsibility |
|------|------------------|
| `lib/utils/engagement-inngest-display.ts` | Pure helpers: when to soften/hide misleading Inngest failure vs BUILDING + live Jules. |
| `lib/utils/engagement-inngest-display.test.ts` | Vitest coverage for all branches. |
| `app/(marketing)/dashboard/automation/queue/[id]/_components/engagement-panel.tsx` | Badge variant/label, Jules alert + helper text, design `Image` props / optional native `img` for Google URLs. |
| `lib/inngest/functions/jules-poller.ts` | `POLL_INTERVAL_SECONDS` → 300; comment updates. |
| `app/(marketing)/dashboard/automation/queue/[id]/page-client.tsx` | `setInterval` delay: 5 min if `stage === "BUILDING"`, else 10s; stabilize `useEffect` deps; optional immediate refetch when entering `BUILDING`. |
| `next.config.ts` | Fix invalid `remotePatterns[].hostname` (trailing slash). |

`app/(marketing)/dashboard/automation/queue/[id]/page.tsx` stays a thin wrapper — no change required unless you add metadata; the bug is in client + config + poller.

---

### Task 1: `shouldMaskInngestFailureForActiveJules` helper + tests

**Files:**

- Create: `lib/utils/engagement-inngest-display.ts`
- Create: `lib/utils/engagement-inngest-display.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/utils/engagement-inngest-display.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
  julesStateIndicatesBuildInFlight,
  shouldMaskInngestFailureForActiveJules,
} from "./engagement-inngest-display";

describe("julesStateIndicatesBuildInFlight", () => {
  it("returns false for null/undefined", () => {
    expect(julesStateIndicatesBuildInFlight(null)).toBe(false);
    expect(julesStateIndicatesBuildInFlight(undefined)).toBe(false);
  });

  it("returns true for common non-terminal Jules states", () => {
    expect(julesStateIndicatesBuildInFlight("QUEUED")).toBe(true);
    expect(julesStateIndicatesBuildInFlight("in_progress")).toBe(true);
    expect(julesStateIndicatesBuildInFlight("RUNNING")).toBe(true);
    expect(julesStateIndicatesBuildInFlight("PLANNING")).toBe(true);
    expect(julesStateIndicatesBuildInFlight("AWAITING_PLAN_APPROVAL")).toBe(true);
  });

  it("returns false for terminal success/failure-ish states", () => {
    expect(julesStateIndicatesBuildInFlight("COMPLETED")).toBe(false);
    expect(julesStateIndicatesBuildInFlight("SUCCEEDED")).toBe(false);
    expect(julesStateIndicatesBuildInFlight("FAILED")).toBe(false);
    expect(julesStateIndicatesBuildInFlight("CANCELLED")).toBe(false);
  });
});

describe("shouldMaskInngestFailureForActiveJules", () => {
  it("masks only when BUILDING + stored Failed + Jules in-flight", () => {
    expect(
      shouldMaskInngestFailureForActiveJules({
        stage: "BUILDING",
        inngestRunStatus: "Failed",
        julesState: "IN_PROGRESS",
      }),
    ).toBe(true);
  });

  it("does not mask when stage is not BUILDING", () => {
    expect(
      shouldMaskInngestFailureForActiveJules({
        stage: "DESIGN_COMPLETE",
        inngestRunStatus: "Failed",
        julesState: "IN_PROGRESS",
      }),
    ).toBe(false);
  });

  it("does not mask when Inngest did not record Failed", () => {
    expect(
      shouldMaskInngestFailureForActiveJules({
        stage: "BUILDING",
        inngestRunStatus: "Completed",
        julesState: "IN_PROGRESS",
      }),
    ).toBe(false);
  });

  it("does not mask when Jules is terminal", () => {
    expect(
      shouldMaskInngestFailureForActiveJules({
        stage: "BUILDING",
        inngestRunStatus: "Failed",
        julesState: "COMPLETED",
      }),
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && bunx vitest run lib/utils/engagement-inngest-display.test.ts
```

Expected: FAIL (module not found or exports missing).

- [ ] **Step 3: Implement minimal module**

Create `lib/utils/engagement-inngest-display.ts`:

```typescript
const IN_FLIGHT = new Set([
  "QUEUED",
  "IN_PROGRESS",
  "RUNNING",
  "PLANNING",
  "AWAITING_PLAN_APPROVAL",
]);

export function julesStateIndicatesBuildInFlight(julesState: string | null | undefined): boolean {
  if (!julesState) return false;
  return IN_FLIGHT.has(julesState.toUpperCase());
}

export function shouldMaskInngestFailureForActiveJules(params: {
  stage: string;
  inngestRunStatus: string | null | undefined;
  julesState: string | null | undefined;
}): boolean {
  return (
    params.stage === "BUILDING" &&
    params.inngestRunStatus === "Failed" &&
    julesStateIndicatesBuildInFlight(params.julesState)
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
bunx vitest run lib/utils/engagement-inngest-display.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/utils/engagement-inngest-display.ts lib/utils/engagement-inngest-display.test.ts
git commit -m "feat(engagement): add helper to detect misleading Inngest failure during Jules build"
```

---

### Task 2: Engagement panel — Inngest badge, alert copy, Jules polling copy

**Files:**

- Modify: `app/(marketing)/dashboard/automation/queue/[id]/_components/engagement-panel.tsx` (imports, derived flags near `julesIsRunning`, badge block ~339–352, alert ~712–719, helper paragraph ~721–725)

- [ ] **Step 1: Wire helper and derived display status**

Near the top of `engagement-panel.tsx` (after existing imports), add:

```typescript
import {
  julesStateIndicatesBuildInFlight,
  shouldMaskInngestFailureForActiveJules,
} from "@/lib/utils/engagement-inngest-display";
```

Immediately after `const julesIsFailed = ...` (existing block ~300–310), add:

```typescript
  const maskInngestFailure = shouldMaskInngestFailureForActiveJules({
    stage,
    inngestRunStatus: status?.inngestRunStatus,
    julesState,
  });

  const inngestBadgeLabel = maskInngestFailure
    ? "Handed off"
    : status?.inngestRunStatus ?? "";

  const inngestBadgeVariant:
    | "destructive"
    | "secondary"
    | "outline" = maskInngestFailure
    ? "outline"
    : status?.inngestRunStatus === "Failed"
      ? "destructive"
      : status?.inngestRunStatus === "Completed"
        ? "secondary"
        : "outline";
```

- [ ] **Step 2: Replace Inngest badge JSX**

Find the block:

```tsx
{status?.inngestRunStatus && (
  <Badge
    variant={
      status.inngestRunStatus === "Failed"
        ? "destructive"
        : status.inngestRunStatus === "Completed"
          ? "secondary"
          : "outline"
    }
    ...
  >
    Inngest: {status.inngestRunStatus}
  </Badge>
)}
```

Replace with:

```tsx
{status?.inngestRunStatus && (
  <Badge variant={inngestBadgeVariant} className="font-mono text-[10px] uppercase tracking-wider">
    Inngest: {inngestBadgeLabel}
  </Badge>
)}
```

(Keep the existing `className` if your file merged it into one line — preserve formatting to match file style.)

- [ ] **Step 3: Alert — informational when failure is misleading**

Remove the old block tied to `julesIsRunning && status?.inngestRunStatus === "Failed"` (the **“Orchestrator crashed”** copy).

When **`maskInngestFailure`** is true, show a single **non-destructive** `Alert` (default/outline styling per your `Alert` variants), for example:

> The last Inngest run recorded an error, but Jules still shows an active build. The reconciler keeps syncing from Jules; this page updates on its own.

Do **not** show a destructive alert for that case — the stored `inngestRunStatus` is stale relative to live Jules work (`makeOnFailure` in `lib/inngest/functions/_shared/on-failure.ts` intentionally does not set `stage` to `FAILED`).

**Note:** `maskInngestFailure` uses `julesStateIndicatesBuildInFlight`, which includes `AWAITING_PLAN_APPROVAL`; the existing `julesIsRunning` flag in the panel does not, so base the alert on **`maskInngestFailure`**, not on `julesIsRunning && Failed`.

- [ ] **Step 4: Update static Jules copy to 5 minutes**

Replace the sentence that says **“Poller checks every 60s”** with **“Poller checks every 5 minutes”** (and optionally “Jules builds often take 20–40 minutes” to match operator expectations).

- [ ] **Step 5: Run Vitest for regression**

```bash
bunx vitest run lib/utils/engagement-inngest-display.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/(marketing)/dashboard/automation/queue/[id]/_components/engagement-panel.tsx
git commit -m "fix(ui): soften Inngest badge during live Jules build and fix alert copy"
```

---

### Task 3: Jules Inngest poller — 5 minute cadence

**Files:**

- Modify: `lib/inngest/functions/jules-poller.ts` (constant ~26–27, file header comment ~22–25)

- [ ] **Step 1: Change constant**

Replace:

```typescript
const POLL_INTERVAL_SECONDS = 60;
```

With:

```typescript
/** ~5 minutes between Jules polls — long builds (20–40+ min) do not need per-minute pressure on the API. */
const POLL_INTERVAL_SECONDS = 300;
```

Update the docblock at the top of the file that currently says “~60s” to say “~300s (5 minutes)”.

- [ ] **Step 2: Commit**

```bash
git add lib/inngest/functions/jules-poller.ts
git commit -m "chore(jules): poll Jules session every 5 minutes instead of 60s"
```

*(No new Vitest required unless you add a trivial export test for the constant — YAGNI.)*

---

### Task 4: Queue detail client — BUILDING-only 5 minute status polling

**Files:**

- Modify: `app/(marketing)/dashboard/automation/queue/[id]/page-client.tsx` (the `useEffect` with `setInterval` ~143–164)

- [ ] **Step 1: Refactor interval effect**

Replace the polling `useEffect` body so that:

1. **`pollMs`** = `engagementStatus?.stage === "BUILDING" ? 300_000 : 10_000`.

2. **Dependency array** must **not** list the entire `engagementStatus` object (that resets the timer on every field change). Use at minimum:  
   `[id, engagementLoading, statusUnavailable, engagementStatus?.stage]`  
   plus whatever you need so the interval is cleared when the prospect becomes terminal (you can keep a separate `useEffect` that clears when terminal, or read `engagementStatus` from a ref inside the tick — simplest acceptable approach: include `engagementStatus?.stage` only, and inside `setInterval` always `fetch` then `setEngagementStatus`; when the response is terminal, `clearInterval` inside the callback after setState — mirror existing “clear when terminal” behavior).

3. **Immediate refetch when entering BUILDING:** optional but recommended — inside the same effect, if `engagementStatus?.stage === "BUILDING"`, call the same async fetch function once before `setInterval`, so the user does not wait 5 minutes after a stage transition.

Example shape (adapt to existing fetch/error handling in file — **keep the same early returns as today**):

```typescript
  useEffect(() => {
    if (engagementLoading) return;
    if (!statusUnavailable && engagementStatus && isTerminalStage(engagementStatus.stage)) return;

    const pollMs = engagementStatus?.stage === "BUILDING" ? 300_000 : 10_000;

    let intervalId: ReturnType<typeof setInterval> | undefined;

    async function tick() {
      try {
        const res = await fetch(`/api/engagement/status/${id}`);
        if (res.ok) {
          const data: EngagementStatus = await res.json();
          setEngagementStatus(data);
          setStatusUnavailable(false);
          if (isTerminalStage(data.stage) && intervalId) clearInterval(intervalId);
        } else {
          setStatusUnavailable(true);
        }
      } catch {
        setStatusUnavailable(true);
      }
    }

    if (engagementStatus?.stage === "BUILDING") void tick();

    intervalId = setInterval(tick, pollMs);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, engagementStatus?.stage, engagementLoading, statusUnavailable]);
```

Verify: when `engagementStatus` is `null` initially, `pollMs` is 10_000 (same as today) until stage is known; once `BUILDING`, interval becomes 5 minutes.

- [ ] **Step 2: Manual sanity check**

Run dev server, open a lead in `BUILDING`, confirm network tab shows status requests spaced ~5 min (and one immediate on entry if implemented).

- [ ] **Step 3: Commit**

```bash
git add app/(marketing)/dashboard/automation/queue/[id]/page-client.tsx
git commit -m "fix(ui): poll engagement status every 5 min only during BUILDING"
```

---

### Task 5: Design concept images — config + request behaviour

**Files:**

- Modify: `next.config.ts`
- Modify: `app/(marketing)/dashboard/automation/queue/[id]/_components/engagement-panel.tsx` (design concept `Image` ~587–594)

- [ ] **Step 1: Fix `remotePatterns` hostname**

In `next.config.ts`, change:

```typescript
hostname: "lh3.googleusercontent.com/",
```

To:

```typescript
hostname: "lh3.googleusercontent.com",
```

(Next expects hostname only; the trailing slash is invalid and can break optimisation/signing for remote images.)

- [ ] **Step 2: Harden preview `<Image>`**

On the design-concept `Image` component, add:

```tsx
referrerPolicy="no-referrer"
loading="lazy"
```

Keep `unoptimized` as today so Next’s image optimizer does not bulk-fetch Google URLs server-side (which contributes to 429).

- [ ] **Step 3: If 429 persists in QA**

Add a follow-up task (separate PR if preferred): a route `app/api/engagement/design-preview/route.ts` that accepts a signed or internal id, server-fetches the image once, returns `Cache-Control: public, max-age=86400`, and store **stable** URLs in DB at Stitch time — only if product needs guaranteed thumbnails. **Do not implement in the same pass** unless Step 1–2 fail in your environment.

- [ ] **Step 4: Verify compilation**

Read and follow `.claude/skills/next-compile/SKILL.md`: ensure Turbopack dev shows no compile errors for touched files.

- [ ] **Step 5: Commit**

```bash
git add next.config.ts app/(marketing)/dashboard/automation/queue/[id]/_components/engagement-panel.tsx
git commit -m "fix(images): correct googleusercontent remote pattern and reduce preview 429 risk"
```

---

## Self-review (completed)

1. **Spec coverage:** Misleading Inngest badge → Task 1–2. BUILDING-only slower polling → Task 3–4 + copy in Task 2. “Orchestrator crashed” copy → Task 2. Design images / 429 / page → Task 5 (panel + `next.config`; `page.tsx` is only a wrapper).
2. **Placeholder scan:** No TBD/TODO in steps.
3. **Type consistency:** `BUILDING`, `Failed`, and Jules state strings align with `engagement-panel.tsx` and `jules-poller.ts` usage.

---

## Execution handoff

**Plan complete and saved to** `docs/superpowers/plans/2026-04-24-engagement-queue-accuracy-jules-poll-design-images.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration. **REQUIRED SUB-SKILL:** superpowers:subagent-driven-development.

2. **Inline Execution** — Execute tasks in this session using checkpoints. **REQUIRED SUB-SKILL:** superpowers:executing-plans.

**Which approach do you want?**
