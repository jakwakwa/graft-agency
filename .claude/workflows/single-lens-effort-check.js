export const meta = {
  name: 'single-lens-effort-check',
  description: 'Re-run one finder lens with pinned high effort to confirm the earlier empty result was an effort-level artifact',
  phases: [{ title: 'Find' }],
}

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

const prompt = `${REPO_CONTEXT}
LENS: Webhook signature verification.
Audit app/api/webhooks/paddle, app/api/webhooks/cal, app/api/webhooks/vercel-deploy and
lib/services/webhook-receipt.service.ts. Every handler MUST verify the provider signature against a
secret from env BEFORE acting on the payload (Paddle: paddle.webhooks.unmarshal()). Flag any handler
that parses/acts first, uses the raw body incorrectly for verification, or has no verification.`

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
          title: { type: 'string' },
          file: { type: 'string' },
          line: { type: 'integer' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          evidence: { type: 'string' },
          why: { type: 'string' },
        },
      },
    },
  },
}

phase('Find')
const lowEffort = await agent(prompt, { phase: 'Find', label: 'webhook-verification:low', schema: FINDINGS, model: 'sonnet', effort: 'low' })
const highEffort = await agent(prompt, { phase: 'Find', label: 'webhook-verification:high', schema: FINDINGS, model: 'sonnet', effort: 'high' })

log(`low effort: ${(lowEffort?.findings||[]).length} findings`)
log(`high effort: ${(highEffort?.findings||[]).length} findings`)

return { lowEffort, highEffort }
