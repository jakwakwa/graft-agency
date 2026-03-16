---
module: Portal / Customer Dashboard
date: 2026-03-16
problem_type: integration_issue
component: nextjs_routing
symptoms:
  - "`[domain]` segment in route was undefined at runtime"
  - "Tenant terminology didn't match the model: customers log in via Clerk, not subdomains"
  - "Nav links used `/${domain}/tenant-kona` but domain was never resolved"
root_cause: wrong_routing_model
resolution_type: code_fix
severity: medium
tags: [nextjs, routing, portal, clerk, customer-dashboard]
---

# Dynamic [domain] Undefined for Customer Portal Routing

## Problem

The customer dashboard was scaffolded under `app/(tenant)/[domain]/` with routes like `/{domain}/tenant-kona`, `/{domain}/tenant-billing`. The `[domain]` segment was intended for subdomain-style multi-tenant routing (e.g. `acme.kona.agency` → `/acme/`). In reality:

- Customers are invited by the platform and log in via Clerk
- There is no subdomain; they use the same domain
- `[domain]` was never populated, so URLs and nav links broke

## Environment

- Module: Portal / Customer Dashboard
- Affected: `app/(tenant)/[domain]/` route group
- Key files: `app/(tenant)/[domain]/layout.tsx`, nav links
- Date: 2026-03-16

## Symptoms

- `domain` in layout params was `undefined`
- Nav links like `/${domain}/tenant-kona` resolved to `/undefined/tenant-kona`
- Terminology "tenant" was misleading—they are customers with their own Clerk orgs, not tenants in the platform org

## Root Cause

Using a dynamic `[domain]` segment assumed subdomain-based routing. The actual model is: platform creates Clerk orgs for customers, invites them, and they log in. No subdomain resolution is needed. The URL does not need to identify the customer—auth does.

## Solution

1. **Replace dynamic segment with static path:** `app/(tenant)/[domain]/` → `app/(portal)/portal/`
2. **Use static routes:** `/portal`, `/portal/embed`, `/portal/billing`, `/portal/settings`
3. **Rename tenant → portal:** Route group `(tenant)` → `(portal)`; pages `tenant-kona` → `embed`, `tenant-billing` → `billing`, `tenant-kona-settings` → `settings`
4. **Simplify layout:** Remove `params`; nav links use hardcoded `/portal`, `/portal/embed`, etc.
5. **Update redirects:** Non-platform users redirect to `/portal` instead of `/dashboard/tenant`

### Before

```
app/(tenant)/[domain]/
  layout.tsx     → params.domain (undefined)
  page.tsx      → /{domain}/
  tenant-kona/   → /{domain}/tenant-kona
  tenant-billing/
  tenant-kona-settings/
```

### After

```
app/(portal)/portal/
  layout.tsx    → no params
  page.tsx      → /portal
  embed/         → /portal/embed
  billing/       → /portal/billing
  settings/      → /portal/settings
```

### Layout change

```tsx
// Before: needed domain for nav
function TenantNavHeader({ domain }: { domain: string }) {
  return (
    <nav>
      <Link href={`/${domain}/tenant-kona`}>Dashboard</Link>
      ...
    </nav>
  );
}

// After: static paths
function PortalNavHeader() {
  return (
    <nav>
      <Link href="/portal">Dashboard</Link>
      <Link href="/portal/embed">Embed</Link>
      <Link href="/portal/billing">Billing</Link>
      <Link href="/portal/settings">Settings</Link>
    </nav>
  );
}
```

## Prevention

- **No subdomain? No dynamic segment.** If customers log in via Clerk and you resolve identity from auth, use a static path like `/portal` or `/customer`.
- **Terminology:** Use "customer" or "portal" when they are separate orgs you invite, not "tenant" (which implies sub-tenancy).
- **Rule of thumb:** Dynamic route segments should map to something you can resolve (subdomain, slug from DB). If you can't populate it, use a static path.

## Verification

```bash
bun run build
# Routes: /portal, /portal/embed, /portal/billing, /portal/settings
```

## Related Issues

- `docs/living-sop.md` — Platform vs customer split; outbound platform-only
- `.cursor/rules/frontend.instructions.md` — "Treat app/[domain]/ as incomplete multi-tenant groundwork"
