---
name: security-pipeline
description: Run the autonomous security-audit-to-PR pipeline over the GRAFT.TODAY codebase. Fans out finder agents across security lenses (BOLA/tenant-scoping, Server Action auth, route coverage, PII egress, webhook verification, secret exposure), adversarially verifies each finding by majority vote, automatically files a Linear issue per confirmed finding (Podslice Ai / GRAFT TODAY project), then optionally fixes each confirmed issue in an isolated worktree and opens a PR. Use when the user asks to audit security, run the security pipeline, sweep for vulnerabilities, or ship security fixes. Ticket filing always runs; pass "open-prs" to also fix + ship PRs.
---

# Security Audit → PR Pipeline

Orchestrates a multi-agent security sweep: finds vulnerabilities, adversarially verifies them,
automatically files a Linear issue per confirmed finding, and (optionally) opens one PR per
confirmed vulnerability. Invoking this skill is explicit opt-in for the Workflow tool.

Triage is NOT a manual/ad-hoc step — it is a pipeline phase (`Ticket`, between Verify and Fix)
that always runs when there are confirmed findings, regardless of dry-run/open-prs. The human
reviews findings in Linear or in the session output; do not hand-create Linear issues yourself
outside this script.

## When invoked

1. **Parse the argument.**
   - empty / `dry` / `find-only` → **default, safe mode**: run **Find + Verify + Ticket**, no PRs.
   - `open-prs` / `ship` → additionally opt in to the Fix phase (opens real PRs). Requires explicit intent.
   - A number (e.g. `4`) → cap the number of PRs opened this run at that value (implies open-prs).

2. **Run the workflow.** Call the Workflow tool with the saved script:
   - Dry (default): `Workflow({ name: "security-audit-to-pr" })`
   - Open PRs: `Workflow({ name: "security-audit-to-pr", args: { openPrs: true, maxPrs: <n> } })`
   - **Fail-safe:** the script defaults to dry-run and only opens PRs when `openPrs === true`.
     If args don't thread through the named-workflow path, it degrades to dry-run, never to firing PRs.
     If a real run comes back `dryRun:true` unexpectedly, invoke by `scriptPath` instead of `name`
     so args are guaranteed to pass:
     `Workflow({ scriptPath: ".claude/workflows/security-audit-to-pr.js", args: { openPrs: true } })`.
   - To tune lenses or schemas, edit `.claude/workflows/security-audit-to-pr.js` and re-run.

   **Model tiering** (already set in the script): preflight → Haiku, finders → Sonnet,
   adversarial verifiers + fix agents → default (strongest). Keep the verify/fix tier strong —
   they are the correctness gates.

3. **Report the result table.** When the workflow returns, present a table to the user:
   - Always → columns: severity · title · file:line · confirm-votes (N/3) · Linear issue (id/url/status).
     Also list rejected findings (what was refuted and why) so the user can spot false negatives.
   - If `openPrs` was set → additionally: PR URL · test status per fixed finding.
   - Never auto-merge. Ticket filing is the done-state for a dry run; "PRs open, tests green" is the
     done-state for an open-prs run.

## Arguments the script accepts (via `args`)

- `openPrs: true` — enable the Fix phase (default false = ticket-only, no PRs).
- `maxPrs: <n>` — cap PRs opened this run (default 6).
- `opEnvName: "<name>"` — which 1Password environment to validate env against (default `"graft today dev"`;
  use `"graft today prod"` for a prod-readiness check).
- `skipEnvCheck: true` — annotate that env validation should be skipped (the preflight still reports git/gh).
- `linearTeam` / `linearProject` — override the Linear team/project findings are filed under
  (default `"Podslice Ai"` / `"GRAFT TODAY"`).

## Guardrails (baked into the script — do not bypass)

- **Preflight first.** The pipeline checks `gh auth status`, clean tree on main, build health, **and env
  validation via the 1Password MCP** — it diffs `.env.example` (what the code documents) against the
  target 1Password environment and flags missing security-critical secrets (webhook secrets, API keys,
  signing keys, DB URL). Missing secrets are surfaced as warnings and cross-checked against findings
  (e.g. a missing `CAL_WEBHOOK_SECRET` means a signature-verification fix can't be tested). Hard blockers
  (dirty tree, not on main, `gh` unauthenticated) stop the Fix phase; the env check is a **soft** gate and
  degrades to "skipped" if the 1Password MCP is unreachable (headless/cron), never a blocker.
- **Adversarial verification is mandatory.** Every finding faces 3 independent refuter agents;
  only majority-confirmed (≥2/3) findings survive. This is the guard against plausible-but-wrong fixes.
- **Effort is pinned, not inherited.** Every agent call (`preflight`, Find, Verify, Ticket, Fix) sets
  its own `effort`. Confirmed empirically: the same finder lens at `effort:'low'` returned 0 findings
  on a codebase with 2 known, real bugs in its exact category; at `effort:'high'` it found both. If the
  session's default effort/model is ever lowered for unrelated work, this pipeline must not inherit that.
- **Ticket filing is automatic, not manual.** The `Ticket` phase runs for every confirmed finding,
  searching Linear first to skip duplicates before creating. This replaced an earlier ad-hoc approach
  (hand-typing `save_issue` calls per finding) that doesn't scale and isn't repeatable across runs.
- **Worktree isolation per fix.** Every fix agent runs in its own git worktree (`isolation: 'worktree'`)
  so parallel fixes never collide and nothing lands on main directly.
- **PR cap per run.** Default 6. Smaller batches survive interruptions (each PR is a durable checkpoint)
  and keep the review queue sane. Deferred findings are reported, not silently dropped.

## Resume

If a run is interrupted mid-Fix, relaunch with
`Workflow({ scriptPath: ".claude/workflows/security-audit-to-pr.js", resumeFromRunId: "<runId>" })`.
Completed Find/Verify agents return cached results instantly; only unfinished fixes re-run.

## Scheduling

To run weekly, wrap this in `/schedule`. Note: interactively-authenticated MCP servers may be
absent in headless/cron runs, so if you later add Linear ticket creation, use a Linear API key
rather than the claude.ai-authenticated MCP.
