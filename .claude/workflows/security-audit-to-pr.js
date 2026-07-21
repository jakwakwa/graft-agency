export const meta = {
  name: 'security-audit-to-pr',
  description: 'Audit codebase across security lenses, adversarially verify findings, fix each in an isolated worktree, and open PRs',
  whenToUse: 'Weekly or on-demand security sweep of the GRAFT.TODAY codebase. Default (no args) files confirmed findings as Linear tickets and stops there. Pass {openPrs:true} to also fix + open PRs.',
  phases: [
    { title: 'Preflight', detail: 'gh auth, clean build on main, env validation via 1Password, tool reachability' },
    { title: 'Find', detail: 'one finder agent per security lens' },
    { title: 'Verify', detail: 'adversarial refutation, majority rules' },
    { title: 'Ticket', detail: 'file a Linear issue per confirmed finding (Podslice Ai / GRAFT TODAY)' },
    { title: 'Fix', detail: 'one worktree-isolated fix+PR agent per confirmed finding (opt-in via openPrs)' },
  ],
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const FINDINGS = {
  type: 'object',
  additionalProperties: false,
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'file', 'line', 'severity', 'evidence', 'why'],
        properties: {
          title: { type: 'string', description: 'One-line description of the vulnerability' },
          file: { type: 'string', description: 'Repo-relative path' },
          line: { type: 'integer', description: '1-indexed line the issue anchors to' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          evidence: { type: 'string', description: 'The actual code snippet or exact quote proving the issue' },
          why: { type: 'string', description: 'Concrete exploit/impact: who can do what to whom' },
        },
      },
    },
  },
}

const VERDICT = {
  type: 'object',
  additionalProperties: false,
  required: ['refuted', 'reason'],
  properties: {
    refuted: { type: 'boolean', description: 'true if the finding is NOT a real exploitable issue' },
    reason: { type: 'string', description: 'What in the actual code confirms or refutes it' },
  },
}

const PR_RESULT = {
  type: 'object',
  additionalProperties: false,
  required: ['status', 'branch', 'summary'],
  properties: {
    status: { type: 'string', enum: ['pr_opened', 'build_failed', 'no_fix_needed', 'error'] },
    branch: { type: 'string' },
    prUrl: { type: 'string' },
    summary: { type: 'string', description: 'What was changed and what test was added' },
    testStatus: { type: 'string', description: 'Result of build + lint + test loop' },
  },
}

const TICKET_RESULT = {
  type: 'object',
  additionalProperties: false,
  required: ['status'],
  properties: {
    status: { type: 'string', enum: ['created', 'duplicate_skipped', 'error'] },
    issueId: { type: 'string', description: 'e.g. PODGRAF-123' },
    url: { type: 'string' },
    reason: { type: 'string', description: 'Why skipped/errored, or duplicate issue id if one already existed' },
  },
}

const PREFLIGHT_REPORT = {
  type: 'object',
  additionalProperties: false,
  required: ['ghAuth', 'gitClean', 'onMain', 'env', 'blockers', 'summary'],
  properties: {
    ghAuth: { type: 'boolean', description: 'GitHub CLI authenticated with repo+workflow scope' },
    gitClean: { type: 'boolean', description: 'No modified/staged tracked files' },
    onMain: { type: 'boolean', description: 'Currently on the main branch' },
    buildLikelyPasses: { type: 'boolean' },
    env: {
      type: 'object',
      additionalProperties: false,
      required: ['checked', 'missing', 'missingCritical'],
      properties: {
        checked: { type: 'boolean', description: 'false if 1Password MCP was unreachable (headless/cron) — treated as a soft skip, not a blocker' },
        environmentName: { type: 'string' },
        missing: { type: 'array', items: { type: 'string' }, description: 'Key NAMES documented in .env.example but absent from the 1Password environment' },
        missingCritical: { type: 'array', items: { type: 'string' }, description: 'Subset of missing that are security-critical secrets (webhook secrets, api keys, signing keys, db url)' },
        note: { type: 'string', description: 'Any cross-check relevant to the audit, e.g. a webhook secret being absent while a signature-verification finding exists' },
      },
    },
    blockers: { type: 'array', items: { type: 'string' }, description: 'Hard blockers that must stop the Fix phase (dirty tree, not on main, gh unauthenticated). Missing env secrets are WARNINGS, not blockers.' },
    summary: { type: 'string' },
  },
}

// ---------------------------------------------------------------------------
// Security lenses — tuned to this codebase's real layout and conventions
// ---------------------------------------------------------------------------

const REPO_CONTEXT = `
GRAFT.TODAY is a multi-tenant Next.js (App Router) + Prisma + Clerk SaaS.
Key conventions you MUST assume when judging a finding:
- Every Client is a tenant. Clerk Organizations map 1:1 to Prisma Client records.
- Tenant scoping is resolved via lib/auth/resolve-client.ts: resolveClientIdFromAuth(),
  hasPlatformAccess(), hasChatbotAccess(), requirePlatformAccess(), requirePlatformOwnerAccess().
- Server Actions guard with requireAuthOrSignIn() + resolveClientIdFromAuth() (see lib/auth/guards.ts).
- Data-access MUST be scoped by clientId at the service layer (lib/services/*.service.ts).
- Paddle is MoR; webhooks at app/api/webhooks/paddle/route.ts must verify signatures.
Read the ACTUAL files with your tools before reporting. Report only issues you can prove from real code.
Return an empty findings array if the lens is clean — do not invent issues.
`

const LENSES = [
  {
    key: 'bola-tenant-scoping',
    prompt: `${REPO_CONTEXT}
LENS: Broken Object-Level Authorization / missing tenant scoping.
Audit app/api/**/route.ts and lib/services/*.service.ts. For every Prisma query
(findUnique/findFirst/findMany/update/delete) and every route that takes an :id param
(e.g. app/api/leads/[id], app/api/prospect-queue/[id]), verify the query is constrained by
the caller's clientId resolved from auth — NOT by a clientId taken from the request body/params.
Flag any query where a user from tenant A could read or mutate tenant B's row.`,
  },
  {
    key: 'server-action-auth',
    prompt: `${REPO_CONTEXT}
LENS: Unauthenticated / unauthorized Server Actions.
Server Actions are public endpoints. Audit every file containing "use server"
(app/(portal)/**, app/(marketing)/**). Each exported action MUST call requireAuthOrSignIn()
AND resolve+check clientId BEFORE any mutation, and validate input with zod. Flag actions that
mutate or read tenant data before authenticating, or that trust a clientId from their input.`,
  },
  {
    key: 'route-auth-coverage',
    prompt: `${REPO_CONTEXT}
LENS: Unauthenticated route handlers & privilege escalation.
Audit app/api/**/route.ts. Distinguish intentionally-public routes (widget/embed, chat, inbound
webhooks) from privileged ones (app/api/admin/*, app/api/ops/*, app/api/automation/*,triaged initiated enquiries 
prospect-queue). Flag any privileged route missing an auth check, and any route using
platform/owner capabilities without requirePlatformAccess()/requirePlatformOwnerAccess().`,
  },
  {
    key: 'pii-egress',
    prompt: `${REPO_CONTEXT}
LENS: PII egress.
Trace lead/customer PII (emails, names, phone, message content) through lib/services/email.service.ts,
lib/services/gemini-prospecting.service.ts, lib/ai/**, and lib/inngest/functions/**. Flag PII sent to
third parties (Gemini/Claude prompts, Resend, Vercel, GitHub via jules) without redaction or consent,
and PII written to logs (console.*, operational-event.service) in plaintext.`,
  },
  {
    key: 'webhook-verification',
    prompt: `${REPO_CONTEXT}
LENS: Webhook signature verification.
Audit app/api/webhooks/paddle, app/api/webhooks/cal, app/api/webhooks/vercel-deploy and
lib/services/webhook-receipt.service.ts. Every handler MUST verify the provider signature against a
secret from env BEFORE acting on the payload (Paddle: paddle.webhooks.unmarshal()). Flag any handler
that parses/acts first, uses the raw body incorrectly for verification, or has no verification.`,
  },
  {
    key: 'secret-exposure',
    prompt: `${REPO_CONTEXT}
LENS: Secret & credential exposure.
Search the repo for inlined API keys/secrets/tokens, secrets leaking into client bundles
(NEXT_PUBLIC_* holding a secret, or secrets referenced in "use client" files), secrets in Dockerfiles/
build layers, and secrets returned in API responses or logged. Flag anything that isn't read from a
server-only env var.`,
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Fail-safe: dry-run (find + verify only) is the DEFAULT. Opening PRs is a
// destructive-ish action and must be explicitly requested with { openPrs: true }.
// This guards against args not threading through (e.g. named-workflow invocation)
// silently firing real PRs.
const openPrs = !!(args && args.openPrs === true)
const isDryRun = !openPrs
const MAX_PRS = (args && args.maxPrs) || 6

// Env validation (1Password MCP). Soft by design: if the MCP is unreachable
// (e.g. a headless/cron run), the check is skipped, never treated as a blocker.
const OP_ENV_NAME = (args && args.opEnvName) || 'graft today dev'
const SKIP_ENV_CHECK = !!(args && args.skipEnvCheck)
const key = (f) => `${f.file}:${f.line}:${f.title}`

function dedupe(findings) {
  const seen = new Set()
  const out = []
  for (const f of findings) {
    const k = key(f)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(f)
  }
  return out
}

const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 }

// ---------------------------------------------------------------------------
// Phase 1: Preflight
// ---------------------------------------------------------------------------

phase('Preflight')
const preflight = await agent(
  `Preflight for a security-fix pipeline. Read-only — do NOT fix or change anything. Report status per the schema.

  A. GitHub CLI: run \`gh auth status\`. Set ghAuth true if authenticated with repo+workflow scope.
  B. Git state: run \`git status --short\` and \`git branch --show-current\`. Set gitClean (no modified/staged
     TRACKED files — untracked .claude/ pipeline dirs don't count) and onMain.
  C. Build health: judge whether \`bun run build\` is expected to pass (quick check of obvious breakage;
     do NOT run the full build). Set buildLikelyPasses.
  D. ENV VALIDATION via the 1Password MCP (this is the important new step):
     1. Read .env.example at the repo root and extract the documented key NAMES — every line matching
        ^[A-Z][A-Z0-9_]+= . That is the canonical "what the code expects" list.
     2. Using the 1Password MCP tools (find them via ToolSearch: "onepassword"): authenticate, then
        list_environments, find the environment named "${OP_ENV_NAME}", and list_variables for it.
     3. Diff: env.missing = key names in .env.example that are ABSENT from that 1Password environment.
     4. env.missingCritical = the subset of env.missing that are security-critical secrets — names matching
        any of: *WEBHOOK_SECRET, *_API_KEY, *SECRET*, *_SIGNING_KEY, *_TOKEN, DATABASE_URL.
     5. env.note: cross-check against the audit. Example: if CAL_WEBHOOK_SECRET or VERCEL_WEBHOOK_SECRET is
        missing, a webhook-signature-verification fix cannot be tested — call that out explicitly.
     6. Set env.checked=true. If the 1Password MCP is unreachable/unauthenticated (e.g. headless run),
        set env.checked=false with empty arrays — this is a SOFT skip, NOT a blocker.
     CRITICAL: never output any secret VALUES. Key NAMES only.
  E. blockers[]: ONLY hard blockers that must stop opening PRs — gh unauthenticated, dirty tracked tree,
     or not on main. Missing env secrets are WARNINGS surfaced in env.missing/missingCritical, NOT blockers.`,
  // Now orchestrates 1Password MCP + makes security-relevant judgments about which
  // missing secrets matter — graduated from haiku to sonnet accordingly.
  { phase: 'Preflight', label: 'preflight', model: 'sonnet', effort: 'medium', schema: PREFLIGHT_REPORT },
)
if (SKIP_ENV_CHECK) log('Env check flagged skip via args.skipEnvCheck (agent still reports git/gh state).')
const envMissing = preflight?.env?.missing || []
const envCritical = preflight?.env?.missingCritical || []
log(
  `Preflight: gh=${preflight?.ghAuth} clean=${preflight?.gitClean} main=${preflight?.onMain} | ` +
  `env ${preflight?.env?.checked ? `${envMissing.length} missing (${envCritical.length} critical)` : 'SKIPPED'} | ` +
  `blockers: ${(preflight?.blockers || []).join('; ') || 'none'}`,
)
if (envCritical.length) log(`⚠ Missing security-critical secrets in "${OP_ENV_NAME}": ${envCritical.join(', ')}`)
if (preflight?.env?.note) log(`⚠ Env/audit cross-check: ${preflight.env.note}`)

// ---------------------------------------------------------------------------
// Phase 2: Find (barrier — dedupe needs all findings together)
// ---------------------------------------------------------------------------

phase('Find')
const rawResults = await parallel(
  LENSES.map((l) => () =>
    // Finders generate candidates that every survive an adversarial verify pass,
    // so a mid tier is a good cost/quality trade here. Verifiers stay on the
    // strongest model (default) as the real correctness gate.
    // Effort is pinned, not inherited: a security audit must not silently degrade
    // because the session's default effort was lowered for an unrelated quick task.
    agent(l.prompt, { phase: 'Find', label: `find:${l.key}`, schema: FINDINGS, model: 'sonnet', effort: 'high' }),
  ),
)
const allFindings = rawResults
  .filter(Boolean)
  .flatMap((r) => r.findings || [])
const deduped = dedupe(allFindings).sort(
  (a, b) => (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9),
)
log(`Find: ${allFindings.length} raw findings across ${LENSES.length} lenses → ${deduped.length} after dedupe`)

if (deduped.length === 0) {
  return { dryRun: isDryRun, preflight: String(preflight), confirmed: [], note: 'No findings surfaced.' }
}

// ---------------------------------------------------------------------------
// Phase 3: Verify (3 independent refuters per finding, majority rules)
// ---------------------------------------------------------------------------

phase('Verify')
const verdicts = await parallel(
  deduped.map((f) => () =>
    parallel(
      [0, 1, 2].map((i) => () =>
        agent(
          `${REPO_CONTEXT}
You are refuter #${i + 1}. Your job is to REFUTE the finding below by reading the actual code.
Default to refuted=true unless the code clearly proves the issue is real and exploitable.
Finding: ${JSON.stringify(f)}`,
          { phase: 'Verify', label: `verify:${f.file}#${i + 1}`, schema: VERDICT, effort: 'high' },
        ),
      ),
    ).then((vs) => {
      const votes = vs.filter(Boolean)
      const confirmVotes = votes.filter((v) => !v.refuted).length
      return { finding: f, confirmed: confirmVotes >= 2, confirmVotes, totalVotes: votes.length, verdicts: votes }
    }),
  ),
)
const confirmed = verdicts.filter((v) => v.confirmed).map((v) => v.finding)
log(`Verify: ${confirmed.length}/${deduped.length} findings confirmed by majority`)

// ---------------------------------------------------------------------------
// Phase 3.5: Ticket (automated — files a Linear issue per confirmed finding)
// ---------------------------------------------------------------------------
// Runs regardless of dryRun/openPrs: filing a tracking issue is non-destructive
// and is the mechanism by which a human reviews findings (in Linear or in-session),
// so it must not require the Fix phase to be enabled.

const LINEAR_TEAM = (args && args.linearTeam) || 'Podslice Ai'
const LINEAR_PROJECT = (args && args.linearProject) || 'GRAFT TODAY'
const SEVERITY_TO_PRIORITY = { critical: 1, high: 2, medium: 3, low: 4 }

let tickets = []
if (confirmed.length > 0) {
  phase('Ticket')
  tickets = await parallel(
    confirmed.map((f) => () =>
      agent(
        `You are filing a Linear issue for a CONFIRMED security finding from an automated audit pipeline.
Use the Linear MCP tools (find them via ToolSearch: "linear list_issues save_issue") to:
1. FIRST search for a duplicate: list_issues in team "${LINEAR_TEAM}" / project "${LINEAR_PROJECT}" filtering by
   a query matching this finding's file+title. If an open issue already covers this exact file+title, do NOT
   create a new one — return status "duplicate_skipped" with the existing issue's id in "reason".
2. Otherwise, save_issue with:
   - title: "[Security] ${f.title}"
   - team: "${LINEAR_TEAM}", project: "${LINEAR_PROJECT}"
   - priority: ${SEVERITY_TO_PRIORITY[f.severity] ?? 3} (severity "${f.severity}" → Linear priority)
   - labels: ["security"] (add "Compliance" too if this is a PII/data-privacy finding)
   - description: a markdown body with sections **Source** (automated security-audit-to-PR pipeline,
     confirmed by adversarial verify), **File** (with line number), **Severity**, **Evidence** (the code
     snippet/quote), **Why it matters** (concrete exploit/impact), and **Fix direction** (a short actionable
     suggestion, not a full patch).
Finding: ${JSON.stringify(f)}
Return status "created" with the new issue's id/url, or "duplicate_skipped"/"error" as appropriate.`,
        { phase: 'Ticket', label: `ticket:${f.file}`, schema: TICKET_RESULT, model: 'sonnet', effort: 'medium' },
      ).then((t) => ({ finding: f, ticket: t })),
    ),
  )
  const created = tickets.filter((t) => t?.ticket?.status === 'created').length
  const dupes = tickets.filter((t) => t?.ticket?.status === 'duplicate_skipped').length
  const errored = tickets.filter((t) => !t || t?.ticket?.status === 'error').length
  log(`Ticket: ${created} created, ${dupes} duplicate-skipped, ${errored} errored (${confirmed.length} confirmed findings)`)
}

if (isDryRun) {
  return {
    dryRun: true,
    preflight,
    rawCount: allFindings.length,
    dedupedCount: deduped.length,
    confirmedCount: confirmed.length,
    confirmed,
    tickets,
    rejected: verdicts
      .filter((v) => !v.confirmed)
      .map((v) => ({ title: v.finding.title, file: v.finding.file, confirmVotes: v.confirmVotes })),
  }
}

// ---------------------------------------------------------------------------
// Phase 4: Fix + PR (one worktree-isolated agent per confirmed finding)
// ---------------------------------------------------------------------------

// Hard gate: preflight blockers (dirty tree, not on main, gh unauthenticated) make
// the worktree/PR flow unsafe. Stop here and return findings rather than open PRs.
const blockers = preflight?.blockers || []
if (blockers.length) {
  log(`Fix phase BLOCKED by preflight: ${blockers.join('; ')}. Returning confirmed findings without opening PRs.`)
  return {
    dryRun: false,
    blocked: true,
    preflight,
    confirmedCount: confirmed.length,
    confirmed,
    tickets,
    prs: [],
  }
}

phase('Fix')
const toFix = confirmed.slice(0, MAX_PRS)
if (confirmed.length > MAX_PRS) {
  log(`Capping fixes at ${MAX_PRS}/${confirmed.length} this run (remaining ${confirmed.length - MAX_PRS} deferred).`)
}
const ticketByFile = new Map(tickets.map((t) => [t.finding.file + ':' + t.finding.title, t.ticket]))

const prs = await pipeline(toFix, (f) => {
  const ticket = ticketByFile.get(f.file + ':' + f.title)
  const ticketRef = ticket?.issueId ? `Reference Linear issue ${ticket.issueId} in the PR description.` : ''
  return agent(
    `${REPO_CONTEXT}
Fix this confirmed security vulnerability. You are in an isolated git worktree — work only here.
Finding: ${JSON.stringify(f)}
${ticketRef}

Steps:
1. Create a branch: security/${f.file.replace(/[^a-z0-9]+/gi, '-')}-fix.
2. Implement the minimal correct fix following the codebase's existing auth/scoping conventions.
3. Add a regression test (Vitest under tests/unit/ or Playwright under tests/e2e/) that FAILS
   without your fix and PASSES with it.
4. Loop until green: \`bun run build\` && \`bun run lint\` && \`bun run test\`. Do not proceed on red.
5. Commit, push, and open a PR with \`gh pr create\` describing the vulnerability and the fix.
6. Return the PR URL and final test status.
If the finding turns out not to be real once you read the code, return status "no_fix_needed" with why.`,
    { phase: 'Fix', label: `fix:${f.file}`, isolation: 'worktree', schema: PR_RESULT, effort: 'high' },
  )
})

return {
  dryRun: false,
  preflight,
  confirmedCount: confirmed.length,
  tickets,
  fixedCount: toFix.length,
  prs: prs.filter(Boolean),
}
