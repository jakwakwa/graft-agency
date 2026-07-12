---
title: Clerk Members Admin Uses Client-Linked Organisation
date: 2026-05-01
category: runtime-errors
module: Dashboard members administration
problem_type: runtime_error
component: authentication
symptoms:
  - "ClerkAPIResponseError: Not Found on /dashboard/automation/members"
  - "Clerk returned resource_not_found for getOrganizationMembershipList"
  - "Platform master owner could sign in but the members admin page crashed"
root_cause: config_error
resolution_type: code_fix
severity: high
tags: [clerk, organizations, platform-owner, members-admin, stale-env]
---

# Clerk Members Admin Uses Client-Linked Organisation

## Problem

The members admin page crashed for the platform master owner when it called Clerk's organisation membership API. The code resolved the organisation from `AGENCY_CLERK_ORG_ID || PLATFORM_CLERK_ORG_ID`, but runtime logs proved that env value was stale for the signed-in owner.

## Symptoms

- `ClerkAPIResponseError: Not Found` surfaced from `app/(marketing)/dashboard/automation/members/page.tsx`.
- The failing call was `clerk.organizations.getOrganizationMembershipList({ organizationId })`.
- Runtime evidence showed Clerk returned `resource_not_found:not found` for the env-derived org ID.
- The signed-in platform owner's local `Client` row had a different `clerkOrganizationId` that did exist in Clerk.

## What Didn't Work

- Treating the env var as the source of truth was the failure mode. It pointed at `PLATFORM_CLERK_ORG_ID`, while the authenticated owner's `Client` row pointed at another Clerk organisation.
- Catching the Clerk 404 or showing a generic fallback would only hide the broken lookup. It would not make member invites, revocations, or removals operate on the correct organisation.

## Solution

Resolve the organisation from the authenticated platform client's persisted `clerkOrganizationId`, then pass that ID to every members-admin Clerk call.

```ts
export async function resolvePlatformOrganizationForClient(clientId: string): Promise<PlatformOrganizationResolution> {
  const client = await prisma.client.findFirst({
    where: { id: clientId, deletedAt: null },
    select: { clerkOrganizationId: true },
  });

  if (!client?.clerkOrganizationId) {
    return { error: "Platform organisation is not linked to a Clerk organisation", status: 500 };
  }

  return { organizationId: client.clerkOrganizationId };
}
```

The page and server actions now share that resolver:

```ts
const platformOrganization = await resolvePlatformOrganizationForClient(access.clientId);
if ("error" in platformOrganization) {
  throw new Error(platformOrganization.error);
}

await clerk.organizations.createOrganizationInvitation({
  organizationId: platformOrganization.organizationId,
  inviterUserId: userId,
  emailAddress: email,
  role: "org:member",
  redirectUrl: `${appUrl}/dashboard`,
});
```

## Why This Works

The authenticated `Client` row is the app's tenant record for platform access. It is updated by Clerk organisation and membership webhooks, so it captures the real organisation connected to that platform owner. Using that row avoids coupling runtime membership management to a deploy-time env var that can drift from Clerk state.

The post-fix debug run proved the selected organisation came from the client row, Clerk's `getOrganization` call succeeded for that ID, and both membership and invitation list calls returned successfully.

## Prevention

- For tenant-scoped Clerk calls, derive `organizationId` from the authenticated tenant/client record when one exists. Use env vars for bootstrap or explicit configuration, not as the default runtime source of truth.
- Keep page and server action organisation resolution in one shared helper so list, invite, revoke, and remove operations cannot drift.
- Cover the resolver with a unit test that proves it returns the client's stored `clerkOrganizationId` and returns a configuration error when no Clerk organisation is linked.

## Related Issues

- None documented in lightweight mode.
