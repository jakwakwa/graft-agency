---
module: Prospecting automation
date: 2026-03-28
problem_type: integration_issue
component: background_job
symptoms:
  - "Vercel Cron on the Hobby plan does not support frequent schedules (e.g. every 15 minutes); relying on vercel.json crons for prospecting is invalid or unreliable on that tier."
  - "Prospecting runs need a stable tick aligned to UI-configured UTC times without asking users to edit hosting config."
  - "The Inngest serve endpoint must be reachable for signature verification; Clerk middleware can block unauthenticated API routes if not allowlisted."
root_cause: config_error
resolution_type: code_fix
severity: high
tags: [inngest, vercel, cron, prospecting, clerk, nextjs]
---

# Inngest cron for prospecting instead of Vercel Cron (Hobby-safe)

## Problem

Scheduled prospecting was originally tied to **Vercel Cron** in `vercel.json`. On **Vercel Hobby**, cron frequency is heavily constrained (effectively daily for cron-triggered invocations), so a `*/15 * * * *`-style schedule is not a viable platform feature there. The product still needs a **15-minute tick** that delegates to the existing database-driven scheduler (`runProspectingScheduledJob`), with schedule source of truth in `ProspectingConfig` and the automation UI—not in `vercel.json`.

## Symptoms

- Deploying or validating `vercel.json` crons against a frequent pattern conflicts with Hobby limits or product expectations.
- Operations want **one** scheduling story: Inngest (or similar) for the tick, app logic for “should this client run now?”.
- After adding `app/api/inngest/route.ts`, Inngest Dev Server or cloud may fail to sync or invoke if `/api/inngest` is behind Clerk `auth.protect()`.

## What did not work

- **Relying on Vercel Cron** for sub-hour ticks on Hobby: wrong tool for the constraint; users should not have to upgrade Vercel or hand-edit cron config for normal prospecting.

## Solution

1. **Empty Vercel crons** for this feature so nothing depends on platform cron for the 15-minute loop:

```json
{
  "crons": []
}
```

2. **Inngest client** with prefixed environment variables (consistent with the rest of the app):

```3:8:lib/inngest/client.ts
export const inngest = new Inngest({
  id: "kona-agency",
  name: "Kona Agency",
  eventKey: process.env.KONA_INNGEST_EVENT_KEY,
  signingKey: process.env.KONA_INNGEST_SIGNING_KEY,
});
```

3. **Cron trigger on the Inngest function** (not Vercel), calling the same scheduler the manual/cron route uses:

```24:38:lib/inngest/functions/prospecting-tick.ts
export const prospectingScheduledTick = inngest.createFunction(
  {
    id: "prospecting-scheduled-tick",
    name: "Prospecting scheduled tick",
    triggers: [{ cron: "*/15 * * * *" }],
  },
  async ({ step }) => {
    const summary = await step.run("execute-prospecting", runProspectingInngestStep);

    if (summary.error === true && typeof summary.message === "string") {
      throw new Error(summary.message);
    }

    return summary;
  },
);
```

4. **Serve Inngest** from the App Router:

```1:8:app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { prospectingScheduledTick } from "@/lib/inngest/functions/prospecting-tick";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [prospectingScheduledTick],
});
```

5. **Allowlist `/api/inngest`** in Clerk middleware so Inngest can hit the serve endpoint:

```3:11:proxy.ts
const isPublicRoute = createRouteMatcher([
  "/",
  "/api/chat",
  "/api/embed/(.*)",
  "/api/webhooks/(.*)",
  "/api/cron/(.*)",
  "/api/inngest",
  "/widget/(.*)",
]);
```

6. **Environment (production / preview):** set `KONA_INNGEST_SIGNING_KEY` (and `KONA_INNGEST_EVENT_KEY` when sending events). Point the Inngest app’s sync URL at `https://<host>/api/inngest`.

## Why this works

- **Inngest** owns the **repeating schedule** (`*/15 * * * *`) in a way that is independent of Vercel’s cron tier. The app still decides **per client** whether to run (`runProspectingScheduledJob` + UTC drift window + dedupe), so behaviour stays aligned with `ProspectingConfig`.
- **`serve`** exposes the contract Inngest expects; **signing key** env vars authenticate requests.
- **Public `/api/inngest`** avoids Clerk rejecting Inngest before the SDK runs.

## Prevention

- Prefer **Inngest (or another managed scheduler)** for sub-hour or multi-step schedules; reserve **Vercel Cron** for coarse tasks where tier limits are acceptable.
- When adding new API routes called by **external systems**, add them to `isPublicRoute` (or an equivalent allowlist) in the same change as the route.
- Add or extend **Vitest** coverage for the Inngest step wrapper (`tests/unit/inngest/prospecting-tick.test.ts`) so refactors to `runProspectingInngestStep` stay safe.

## Related documentation

- **Overlap assessment:** **Low** (0–1 dimensions) with existing `docs/solutions/` entries—none cover Inngest vs Vercel Cron for this app.
- See also: `lib/services/prospecting-scheduler.service.ts`, `lib/cron/prospecting-utc.ts`, `app/api/cron/prospecting/route.ts` (manual/secret trigger).
