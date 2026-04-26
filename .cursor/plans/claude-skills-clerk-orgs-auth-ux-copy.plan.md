# Refactor: Org-as-Tenant → Member-as-Tenant + Portal UX Overhaul

## Context

Graft Today Agency currently treats every Clerk Organization as a separate tenant: each org maps 1:1 to a `Client` row with its own white-labeled chatbot. The owner reports the UX is confusing — even *he* doesn't understand the tenant flow when testing. Permission/messaging mismatches happen often.

The owner runs a single agency. There are no other "platform owners" — and there shouldn't be (until a future, out-of-scope multi-tenant pivot). Tenants are really just clients of his agency. They should be **regular members of one Clerk org (the agency)**, not separate orgs themselves.

The fix is to refactor the resolution layer (auth → `clientId`) from `auth().orgId` to `auth().userId`, and to actually build out the member-facing portal that's currently mostly placeholders. Bot customization and embed snippets must work for real (the embed page literally shows a hardcoded fake `clientId` of `1234567890` today). Copy needs to be plainspoken — drop "organisation", "provisioned", "workspace not linked" jargon.

**Decision (from /ux-copy + /auth + clerk-orgs guidance):** keep Clerk Organizations enabled in the Dashboard so the door stays open for future multi-tenancy, but stop using org-as-tenant in app code. One Clerk org for the agency. Owner is `org:admin`. Tenants are `org:member` invited into it.

**Signup model (confirmed):** Invite-only. Owner sends Clerk invitations from a new Members admin page; on accept, a webhook provisions the Client + bot automatically.

## Assumptions

- **Pre-launch / minimal data**: only the owner's `Client` row exists today (the `CLERK_WEBHOOK_BOOTSTRAP_PLATFORM` flag confirms this). The owner's row gets backfilled with `clerkUserId`; no broader migration needed.
- **One agency org**: its id will live in env as `AGENCY_CLERK_ORG_ID` (or reuse `PLATFORM_CLERK_ORG_ID`).
- **Bun is the runtime** per CLAUDE.md (`bun test`, `bunx prisma migrate dev`, etc.).
- **Out of scope**: metrics dashboards, billing build-out, data migration tools, Stripe/Paddle changes.

## Prerequisites (Clerk Dashboard)

Confirm before any code:
1. Organizations enabled (already are).
2. Agency org exists; owner is `org:admin`. Note its `org_xxxxx` id → set as `AGENCY_CLERK_ORG_ID` in `.env`.
3. Webhook at `/api/webhooks/clerk` subscribed to: `organization.created` (keep, bootstrap only), `organizationMembership.created` (NEW), `organizationMembership.deleted` (NEW). Drop `organization.updated`.
4. User & Authentication → Restrictions: switch to **invite-only** (matches signup flow).

## Phase 1 — Schema + auth resolution

### Schema change ([prisma/schema.prisma](prisma/schema.prisma))
- `Client.clerkOrganizationId`: change to `String? @unique` (nullable). Keeps owner row linkage and future-proofs.
- `Client.clerkUserId`: NEW `String? @unique @map("clerk_user_id")` + `@@index([clerkUserId])`. The new resolution key.
- `Client.email`: NEW optional `String? @map("email")` — denormalised at provision time so the Members admin can list without an extra Clerk fetch per row.

Run: `bunx prisma migrate dev --name add_client_clerk_user_id`.

Backfill the owner row in [prisma/seed.ts](prisma/seed.ts) (or one-off SQL): set `clerkUserId` to the owner's Clerk user id. Owner row keeps `clerkOrganizationId` AND adds `clerkUserId` — both populated.

### Auth resolution ([lib/auth/resolve-client.ts](lib/auth/resolve-client.ts))
Rewrite `resolveClientIdFromAuth()`:
- Read `userId` from `auth()` (not `orgId`).
- `prisma.client.findFirst({ where: { clerkUserId: userId, deletedAt: null }, select: { id: true } })` → return `client?.id ?? null`.

Rewrite `requirePlatformAccess()` the same way (query by `clerkUserId`, then check `isPlatformOwner || isReseller`).

`hasPlatformAccess()` and `hasChatbotAccess()` are unchanged — they delegate.

### Platform-client lookup ([lib/auth/platform-client.ts](lib/auth/platform-client.ts))
Keep the priority order; the `PLATFORM_CLERK_ORG_ID` path becomes a fallback (still works because owner row keeps `clerkOrganizationId`). Optionally add a `PLATFORM_CLERK_USER_ID` env tier between `PLATFORM_CLIENT_ID` and the org-id path.

## Phase 2 — Webhook refactor (member-based provisioning)

Rewrite [lib/webhooks/clerk-organizations.ts](lib/webhooks/clerk-organizations.ts) into a dispatcher with these handlers:

- **`organization.created`** — keep, bootstrap only. Runs only when `CLERK_WEBHOOK_BOOTSTRAP_PLATFORM=true` AND no `isPlatformOwner` Client exists. Creates the platform-owner Client with `clerkOrganizationId` set (no `clerkUserId` yet — backfilled below).
- **`organizationMembership.created`** (NEW) — provisions a Client keyed by `clerkUserId` from `public_user_data.user_id`. Default `businessName` from `public_user_data.first_name + last_name` or `identifier` (email). Save `email` field. **If matched user is the existing owner row** (`clerkOrganizationId` matches AND row has no `clerkUserId`), update that row instead of creating a new one — auto-backfills the owner's user link on first sign-in.
- **`organizationMembership.deleted`** (NEW) — soft-delete the Client matching `clerkUserId` (set `deletedAt`).
- **`organization.deleted`** — keep, defensive only.
- **Drop `organization.updated`** — `businessName` is now tenant-controlled in Bot Settings.

Use `prisma.client.upsert` keyed by `clerkUserId` for idempotency. Validate payloads with a `zod` schema mirroring the existing `organizationPayloadSchema`.

Update [app/api/webhooks/clerk/route.ts](app/api/webhooks/clerk/route.ts) to route the new event types.

## Phase 3 — Members admin UI (owner-only)

New route under platform tools.

- **Page**: `app/(marketing)/dashboard/automation/members/page.tsx` — server component, gated by `requirePlatformAccess()`. Fetches:
  - `clerkClient().organizations.getOrganizationMembershipList({ organizationId: AGENCY_CLERK_ORG_ID })` joined with `Client` rows (by `clerkUserId`) for `businessName`.
  - `clerkClient().organizations.getOrganizationInvitationList({ organizationId, status: ['pending'] })`.
- **Server actions**: `app/(marketing)/dashboard/automation/members/actions.ts`
  - `inviteMemberAction(formData)` — gates on `requirePlatformAccess()` + `has({ permission: 'org:sys_memberships:manage' })`. Calls `clerkClient().organizations.createOrganizationInvitation({ organizationId: AGENCY_CLERK_ORG_ID, inviterUserId: userId, emailAddress, role: 'org:member', redirectUrl: \`${NEXT_PUBLIC_APP_URL}/dashboard\` })`.
  - `revokeInvitationAction(invitationId)` — `clerk.organizations.revokeOrganizationInvitation`.
  - `removeMemberAction(membershipId)` — `clerk.organizations.deleteOrganizationMembership` (webhook then soft-deletes Client).
- **Client component**: `app/(marketing)/dashboard/automation/members/_components/invite-form.tsx` — controlled email input, toast on success/error. Reuse existing toast/UI primitives.

Add "Members" to the platform top nav (Phase 4).

## Phase 4 — Portal build-out

### 4a. Bot Settings — replace placeholder
- [app/(portal)/portal/settings/page.tsx](app/(portal)/portal/settings/page.tsx) → server component. Resolves `clientId`; calls existing `agentService.getConfig(clientId)` from [lib/services/agent.service.ts](lib/services/agent.service.ts) (already returns synthetic defaults when no row exists).
- New client form `app/(portal)/portal/settings/_components/bot-settings-form.tsx` — fields: `agentName`, `greetingMessage`, `systemPrompt`, `knowledgeBase` (repeatable Q&A list), `widgetPrimaryColour` (with live swatch), `calComUsername`, `defaultEventSlug`. Use `useFormState` + `useFormStatus`.
- New server action `app/(portal)/portal/settings/actions.ts:saveBotSettingsAction` — zod-validates, resolves `clientId`, `prisma.agentConfig.upsert({ where: { clientId }, ... })`, then `revalidatePath('/portal/settings')` and `revalidatePath('/portal/embed')`.

### 4b. Embed — wire the real clientId
- [app/(portal)/portal/embed/page.tsx](app/(portal)/portal/embed/page.tsx) → server component. `requireAuthOrSignIn()` + `resolveClientIdFromAuth()`; redirect to access-required if null.
- Compute `origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://kona.agency"` (mirrors [app/api/embed/[clientId]/route.ts](app/api/embed/[clientId]/route.ts)).
- Render TWO snippets with the **real** `clientId`:
  - Floating chat button (recommended): `<script src="${origin}/api/embed/${clientId}" async></script>`
  - Inline iframe: `<iframe src="${origin}/widget/${clientId}" width="100%" height="500px" style="border:none;border-radius:12px"></iframe>`
- Existing `<CodeBlockCopyButton />` handles copy-to-clipboard — leave wired.
- Add "Open my bot in a new tab →" link to `/widget/${clientId}`.
- **Remove** the hardcoded "activation (webhook) token" card (no real token concept yet).
- **Remove** the `<MarketingShell>` wrapper (it's a portal page).

### 4c. Billing — keep as friendly coming-soon
[app/(portal)/portal/billing/page.tsx](app/(portal)/portal/billing/page.tsx) — copy revision only (Phase 5). Add a "Soon" badge in nav.

### 4d. Navigation / shell
- New `app/(portal)/layout.tsx` wrapping children in a new `<PortalShell>` (mirrors `<MarketingShell>` surface). Sidebar links: Dashboard, Bot Settings, Embed, Billing (Soon).
- [components/layout/marketing-shell.tsx](components/layout/marketing-shell.tsx) — fix typo `"DASBOARD"` → `"Dashboard"`. Replace platform `topNavLinks` to: Dashboard, Prospect Queue, Leads, Members. Drop the `/portal/embed` link (members-only concern).
- [components/marketing/landing-v2/landing-header-auth.tsx](components/marketing/landing-v2/landing-header-auth.tsx) — drop the "Tenant" button; the `/dashboard` server-side redirect routes the user where they belong.

## Phase 5 — UX copy revision (per /ux-copy)

Plain-English replacements throughout.

### Access-required ([app/(marketing)/dashboard/access-required/page.tsx](app/(marketing)/dashboard/access-required/page.tsx))
**Before:** "Organisation access required" / "Your account is signed in, but this workspace is not linked to a provisioned organisation in Graft yet. Select an organisation you belong to, or ask your administrator to invite you and ensure your Clerk organisation matches a client record in the system." + `<OrganizationSwitcher />`

**After:**
- Heading: **"Your account isn't activated yet"**
- Lead: "We've got your sign-in, but your bot hasn't been set up yet."
- Body: "Hold tight — once Graft activates your account, this page will redirect to your bot. If you think this is a mistake, drop us a line."
- Replace `<OrganizationSwitcher />` with `<UserButton />` + a "Contact support" mailto + "Try again" refresh button.

### Portal dashboard ([app/(portal)/portal/page.tsx](app/(portal)/portal/page.tsx))
- Heading: **"{businessName}'s workspace"**
- Lead: "A snapshot of your bot's recent conversations and bookings."
- Empty leads state: "No conversations yet. Once your bot is live on your site, leads will land here." + CTA "Get embed code →" linking to `/portal/embed`.

### Bot Settings (new)
- Heading: **"Bot settings"** / "Customise how your bot looks, sounds, and what it knows."
- Field labels + hints:
  - `agentName` → "Bot name" — "Shown above the chat — e.g. Sam, Helper, GraftBot."
  - `greetingMessage` → "Greeting" — "The first message your bot says when someone opens chat."
  - `systemPrompt` → "Instructions" — "Tell your bot how to behave — its tone, what it can help with, what to avoid."
  - `knowledgeBase` → "Knowledge snippets" — "Q&A pairs your bot can pull from."
  - `widgetPrimaryColour` → "Brand colour" — "Used for the chat button and accents."
  - `calComUsername` → "Cal.com username" — "Optional — let visitors book a call directly."
  - `defaultEventSlug` → "Booking event" — "Optional — Cal.com event type slug."
- Save toast (success): "Saved. Your bot will use these settings on the next conversation."
- Save toast (error): "Couldn't save. Try again, or refresh and check your connection."

### Embed page
- Heading: **"Add your bot to your site"** / "Drop one of these snippets into your website's HTML."
- Section 1: "Floating chat button (recommended)" — script tag.
- Section 2: "Inline iframe" — iframe tag, hint: "For pages where you want the chat embedded directly."
- Test link: "Open my bot in a new tab →".
- Copy toast: "Copied to clipboard."

### Billing placeholder
- Heading: **"Billing — coming soon"** / "Self-serve billing is on the way. For now, your account is good to go."

## Phase 6 — Cleanup

| Action | Path |
|---|---|
| Delete | `app/(tenant)/` (entire group, incl. `tenant/page.tsx`) — duplicate of `/portal`, unused after `landing-header-auth.tsx` change |
| Delete | `app/(marketing)/dashboard/access-required/_components/clerk-org-switcher-panel.tsx` |
| Update | `components/marketing/landing-v2/constants.ts` — remove `LANDING_ROUTES.tenantDashboard` if unreferenced |
| Update | [app/api/admin/clients/route.ts](app/api/admin/clients/route.ts) — POST schema currently requires `clerkOrganizationId`; deprecate (members are provisioned by webhook now) or refactor to `clerkUserId`. Recommend deprecate. |

## RBAC

Keep flag-based (`Client.isPlatformOwner` + `isReseller`) as the single source of truth — it's already wired everywhere via `requirePlatformAccess()`. The only Clerk-permission check added is `has({ permission: 'org:sys_memberships:manage' })` *inside* `inviteMemberAction` for clearer 403s than parsing Clerk's API error. Don't add Clerk role checks to `/dashboard/automation/*` routes — duplication breeds bugs.

## Sequencing

1. Clerk Dashboard prerequisites.
2. Schema migration + Prisma generate.
3. Auth resolver refactor → `next-compile` + `bun test`.
4. Webhook refactor → exercise with one test invite.
5. Members admin UI.
6. Portal: Settings form, Embed dynamic, Billing copy, PortalShell.
7. Nav cleanup, typo fix, delete `/tenant`, remove org-switcher panel.
8. Copy sweep per Phase 5.
9. End-to-end smoke (below).

## Verification

### Manual end-to-end smoke
**As owner:**
1. Sign in → `/dashboard` redirects to `/dashboard/automation`. Top nav shows Dashboard / Prospect Queue / Leads / Members. No typos. No `OrganizationSwitcher` visible.
2. `/dashboard/automation/members` lists members + pending invites. Submit invite for a fresh email → 200 → invite appears pending. Email arrives.

**As new member:**
3. Click email link, accept invite, sign up via Clerk-hosted UI.
4. Land on `/dashboard` → server redirect → `/portal`. Header reads "{first_name}'s workspace".
5. `/portal/settings` shows current defaults; change `agentName` to "TestBot" → save → toast "Saved." Refresh → persists.
6. `/portal/embed` shows the **real** `clientId` (not `1234567890`). Copy buttons toast. "Open my bot in a new tab →" loads `/widget/{clientId}`. Send a message → bot responds using new `agentName`.

**Negative paths:**
7. Owner removes member from `/dashboard/automation/members` → webhook fires → Client soft-deleted. Member's next request lands on access-required (`resolveClientIdFromAuth` returns null because `deletedAt` is set).
8. Member direct-navigates `/dashboard/automation` → `requirePlatformAccess()` blocks (current behaviour holds).
9. Sign out + access `/portal/settings` → Clerk redirects to sign-in.

### Automated
- `bun test` — add coverage for: webhook dispatcher (bootstrap, membership.created provisioning, owner backfill branch, membership.deleted soft-delete); `resolveClientIdFromAuth` against `clerkUserId`. Existing `lib/auth/guards.test.ts` keeps passing.
- `bun run lint` (Biome 2.2).
- `next-compile` skill (Turbopack dev server) — mandatory after each batch: schema, auth resolver, webhook, each portal page.

## Critical files to modify

- [prisma/schema.prisma](prisma/schema.prisma)
- [lib/auth/resolve-client.ts](lib/auth/resolve-client.ts)
- [lib/auth/platform-client.ts](lib/auth/platform-client.ts)
- [lib/webhooks/clerk-organizations.ts](lib/webhooks/clerk-organizations.ts)
- [app/api/webhooks/clerk/route.ts](app/api/webhooks/clerk/route.ts)
- [app/(portal)/portal/page.tsx](app/(portal)/portal/page.tsx)
- [app/(portal)/portal/settings/page.tsx](app/(portal)/portal/settings/page.tsx) (rewrite)
- [app/(portal)/portal/embed/page.tsx](app/(portal)/portal/embed/page.tsx) (rewrite)
- [app/(portal)/portal/billing/page.tsx](app/(portal)/portal/billing/page.tsx) (copy)
- [app/(marketing)/dashboard/access-required/page.tsx](app/(marketing)/dashboard/access-required/page.tsx)
- [components/layout/marketing-shell.tsx](components/layout/marketing-shell.tsx)
- [components/marketing/landing-v2/landing-header-auth.tsx](components/marketing/landing-v2/landing-header-auth.tsx)

## Critical files to add

- `app/(portal)/layout.tsx` + `components/layout/portal-shell.tsx`
- `app/(portal)/portal/settings/_components/bot-settings-form.tsx`
- `app/(portal)/portal/settings/actions.ts`
- `app/(marketing)/dashboard/automation/members/page.tsx`
- `app/(marketing)/dashboard/automation/members/_components/invite-form.tsx`
- `app/(marketing)/dashboard/automation/members/actions.ts`

## Critical files to delete

- `app/(tenant)/` (entire group)
- `app/(marketing)/dashboard/access-required/_components/clerk-org-switcher-panel.tsx`
