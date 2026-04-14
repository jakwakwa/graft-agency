# Three-Tier Access Model Implementation Plan

**Goal:** Replace the broken `org:admin`-based platform guard with a DB-flag-based three-tier access model: platform owner (Jaco), reseller (white-label), and chatbot client.

**Architecture:** Add `isPlatformOwner` (rename of `isPlatformClient`) and `isReseller` flags to the `Client` model. Auth helpers read these DB flags instead of Clerk roles. Route guards and nav use these helpers to route users to the correct experience.

**Tech Stack:** Next.js App Router, Clerk, Prisma (PostgreSQL), Bun, Vitest

---

## File Map

| File | Change |
|---|---|
| `prisma/schema.prisma` | Rename `isPlatformClient` → `isPlatformOwner`, add `isReseller` |
| `lib/auth/platform-client.ts` | Rename `isPlatformClient` → `isPlatformOwner` in all queries |
| `lib/auth/resolve-client.ts` | Replace `isPlatformAdmin()` with `hasPlatformAccess()` + `hasChatbotAccess()`; update `requirePlatformAccess()` |
| `lib/webhooks/clerk-organizations.ts` | Rename `isPlatformClient` → `isPlatformOwner` |
| `app/(marketing)/dashboard/automation/layout.tsx` | Use `hasPlatformAccess()` instead of `isPlatformAdmin()` |
| `app/api/me/client-flags/route.ts` | New: lightweight endpoint returning client type flags |
| `components/shared/nav-header.tsx` | Fetch `/api/me/client-flags` and conditionally show chatbot vs automation links |
| `scripts/provision-reseller.ts` | New: manual provisioning script for reseller clients |
| `tests/unit/auth/resolve-client.test.ts` | Update tests for new helper names + reseller behaviour |
| `tests/unit/auth/get-platform-client-id.test.ts` | Rename `isPlatformClient` → `isPlatformOwner` in fixtures |
| `tests/unit/webhooks/clerk-organizations.test.ts` | Rename `isPlatformClient` → `isPlatformOwner` in assertions |

---

## Task 1: Schema — rename field + add `isReseller`

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update the Client model**

Replace the `isPlatformClient` field and its index:

```prisma
// prisma/schema.prisma — Client model changes only
isPlatformOwner   Boolean  @default(false) @map("is_platform_owner")
isReseller        Boolean  @default(false) @map("is_reseller")

// In @@index section, replace:
@@index([isPlatformOwner])
// (remove old @@index([isPlatformClient]))
```

Full updated Client model block (replace lines 10–37):

```prisma
model Client {
  id                   String             @id @default(uuid())
  clerkOrganizationId  String             @unique @map("clerk_organization_id")
  businessName         String             @map("business_name")
  industry             String?
  websiteUrl           String?            @map("website_url")
  subdomain            String?            @unique
  calComUserId         Int?               @map("cal_com_user_id")
  subscriptionActive   Boolean            @default(false) @map("subscription_active")
  subscriptionStatus   String             @default("inactive") @map("subscription_status")
  paddleCustomerId     String?            @unique @map("paddle_customer_id")
  paddleSubscriptionId String?            @unique @map("paddle_subscription_id")
  isPlatformOwner      Boolean            @default(false) @map("is_platform_owner")
  isReseller           Boolean            @default(false) @map("is_reseller")
  allowedDomains       String[]           @default([]) @map("allowed_domains")
  createdAt            DateTime           @default(now()) @map("created_at")
  updatedAt            DateTime           @updatedAt @map("updated_at")
  agentConfig          AgentConfig?
  prospectingConfig    ProspectingConfig?
  conversations        Conversation[]
  emailTemplates       EmailTemplate[]
  leads                Lead[]
  prospectQueues       ProspectQueue[]
  productSpecs         ProductSpec[]

  @@index([subdomain])
  @@index([isPlatformOwner])
  @@map("clients")
}
```

- [ ] **Step 2: Generate and run the migration**

```bash
bunx prisma migrate dev --name rename-is-platform-client-add-is-reseller
```

Expected: migration file created and applied, Prisma client regenerated.

- [ ] **Step 3: Verify generated client has new fields**

```bash
grep -n "isPlatformOwner\|isReseller" generated/prisma/index.d.ts | head -10
```

Expected: both field names appear.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: rename isPlatformClient → isPlatformOwner, add isReseller to Client"
```

---

## Task 2: Update `platform-client.ts`

**Files:**
- Modify: `lib/auth/platform-client.ts`

- [ ] **Step 1: Replace all `isPlatformClient` references**

Full file replacement:

```typescript
// lib/auth/platform-client.ts
import prisma from "@/lib/db/prisma";

async function resolvePlatformClientIdFromEnv(): Promise<string | null> {
  const raw = process.env.PLATFORM_CLIENT_ID?.trim();
  if (!raw) return null;

  const row = await prisma.client.findUnique({
    where: { id: raw },
    select: { id: true },
  });
  if (row) return row.id;

  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[resolve-client] PLATFORM_CLIENT_ID is set but no Client exists with that id; ignoring and using PLATFORM_CLERK_ORG_ID / isPlatformOwner fallback.",
    );
  }
  return null;
}

/**
 * Returns the platform owner's client ID.
 * Priority: validated PLATFORM_CLIENT_ID > client for PLATFORM_CLERK_ORG_ID > first isPlatformOwner.
 */
export async function getPlatformClientId(): Promise<string | null> {
  const fromEnv = await resolvePlatformClientIdFromEnv();
  if (fromEnv) return fromEnv;

  const orgId = process.env.PLATFORM_CLERK_ORG_ID;
  if (orgId) {
    const client = await prisma.client.findUnique({
      where: { clerkOrganizationId: orgId },
      select: { id: true },
    });
    if (client) return client.id;
  }

  const client = await prisma.client.findFirst({
    where: { isPlatformOwner: true },
    select: { id: true },
  });
  return client?.id ?? null;
}
```

- [ ] **Step 2: Run existing tests to confirm no breakage**

```bash
bun test tests/unit/auth/get-platform-client-id.test.ts
```

Expected: tests fail because fixtures still use `isPlatformClient`. Fix in Task 4.

- [ ] **Step 3: Commit**

```bash
git add lib/auth/platform-client.ts
git commit -m "refactor: rename isPlatformClient → isPlatformOwner in platform-client.ts"
```

---

## Task 3: Update `resolve-client.ts` — new auth helpers

**Files:**
- Modify: `lib/auth/resolve-client.ts`

- [ ] **Step 1: Replace the file with the updated helpers**

```typescript
// lib/auth/resolve-client.ts
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db/prisma";
import { getPlatformClientId } from "@/lib/auth/platform-client";

export { getPlatformClientId } from "@/lib/auth/platform-client";

/**
 * Resolves clientId from the current user's Clerk org.
 * Returns null if user is not in an org or no Client exists for that org.
 */
export async function resolveClientIdFromAuth(): Promise<string | null> {
  const { orgId } = await auth();
  if (!orgId) return null;

  const client = await prisma.client.findUnique({
    where: { clerkOrganizationId: orgId },
    select: { id: true },
  });
  return client?.id ?? null;
}

/**
 * Returns true if the current user's Client has platform-level access.
 * Grants access to: isPlatformOwner (Jaco) OR isReseller (white-label owners).
 */
export async function hasPlatformAccess(): Promise<boolean> {
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) return false;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { isPlatformOwner: true, isReseller: true },
  });
  return (client?.isPlatformOwner ?? false) || (client?.isReseller ?? false);
}

/**
 * Returns true if the current user's Client has chatbot access.
 * Only the platform owner (Jaco) can configure chatbot agents.
 */
export async function hasChatbotAccess(): Promise<boolean> {
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) return false;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { isPlatformOwner: true },
  });
  return client?.isPlatformOwner ?? false;
}

/**
 * Returns the resolved clientId for the current user if they have platform access.
 * Platform owners and resellers both get their own clientId (data is scoped per client).
 */
export async function requirePlatformAccess(): Promise<
  { clientId: string } | { error: "Unauthorized"; status: 401 } | { error: "Forbidden"; status: 403 }
> {
  const { orgId } = await auth();
  if (!orgId) return { error: "Unauthorized", status: 401 };

  const client = await prisma.client.findUnique({
    where: { clerkOrganizationId: orgId },
    select: { id: true, isPlatformOwner: true, isReseller: true },
  });

  if (!client) return { error: "Unauthorized", status: 401 };
  if (!client.isPlatformOwner && !client.isReseller) return { error: "Forbidden", status: 403 };

  return { clientId: client.id };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/auth/resolve-client.ts
git commit -m "refactor: replace isPlatformAdmin with hasPlatformAccess + hasChatbotAccess"
```

---

## Task 4: Update all tests for renamed/new helpers

**Files:**
- Modify: `tests/unit/auth/resolve-client.test.ts`
- Modify: `tests/unit/auth/get-platform-client-id.test.ts`
- Modify: `tests/unit/webhooks/clerk-organizations.test.ts`

- [ ] **Step 1: Rewrite `resolve-client.test.ts`**

```typescript
// tests/unit/auth/resolve-client.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/db/prisma";

const mockAuth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({ auth: () => mockAuth() }));

describe("requirePlatformAccess", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns clientId for isPlatformOwner client", async () => {
    const client = await prisma.client.create({
      data: { clerkOrganizationId: `test-rpa-owner-${Date.now()}`, businessName: "Owner", isPlatformOwner: true },
    });
    mockAuth.mockResolvedValue({ orgId: client.clerkOrganizationId });
    const { requirePlatformAccess } = await import("@/lib/auth/resolve-client");
    const result = await requirePlatformAccess();
    expect(result).toEqual({ clientId: client.id });
    await prisma.client.delete({ where: { id: client.id } });
  });

  it("returns clientId for isReseller client", async () => {
    const client = await prisma.client.create({
      data: { clerkOrganizationId: `test-rpa-reseller-${Date.now()}`, businessName: "Reseller", isReseller: true },
    });
    mockAuth.mockResolvedValue({ orgId: client.clerkOrganizationId });
    const { requirePlatformAccess } = await import("@/lib/auth/resolve-client");
    const result = await requirePlatformAccess();
    expect(result).toEqual({ clientId: client.id });
    await prisma.client.delete({ where: { id: client.id } });
  });

  it("returns 403 for chatbot-only client", async () => {
    const client = await prisma.client.create({
      data: { clerkOrganizationId: `test-rpa-chatbot-${Date.now()}`, businessName: "Chatbot Client" },
    });
    mockAuth.mockResolvedValue({ orgId: client.clerkOrganizationId });
    const { requirePlatformAccess } = await import("@/lib/auth/resolve-client");
    const result = await requirePlatformAccess();
    expect(result).toEqual({ error: "Forbidden", status: 403 });
    await prisma.client.delete({ where: { id: client.id } });
  });

  it("returns 401 when user has no org", async () => {
    mockAuth.mockResolvedValue({ orgId: null });
    const { requirePlatformAccess } = await import("@/lib/auth/resolve-client");
    const result = await requirePlatformAccess();
    expect(result).toEqual({ error: "Unauthorized", status: 401 });
  });
});

describe("hasPlatformAccess", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns true for isPlatformOwner", async () => {
    const client = await prisma.client.create({
      data: { clerkOrganizationId: `test-hpa-owner-${Date.now()}`, businessName: "Owner", isPlatformOwner: true },
    });
    mockAuth.mockResolvedValue({ orgId: client.clerkOrganizationId });
    const { hasPlatformAccess } = await import("@/lib/auth/resolve-client");
    expect(await hasPlatformAccess()).toBe(true);
    await prisma.client.delete({ where: { id: client.id } });
  });

  it("returns true for isReseller", async () => {
    const client = await prisma.client.create({
      data: { clerkOrganizationId: `test-hpa-reseller-${Date.now()}`, businessName: "Reseller", isReseller: true },
    });
    mockAuth.mockResolvedValue({ orgId: client.clerkOrganizationId });
    const { hasPlatformAccess } = await import("@/lib/auth/resolve-client");
    expect(await hasPlatformAccess()).toBe(true);
    await prisma.client.delete({ where: { id: client.id } });
  });

  it("returns false for chatbot-only client", async () => {
    const client = await prisma.client.create({
      data: { clerkOrganizationId: `test-hpa-chatbot-${Date.now()}`, businessName: "Chatbot" },
    });
    mockAuth.mockResolvedValue({ orgId: client.clerkOrganizationId });
    const { hasPlatformAccess } = await import("@/lib/auth/resolve-client");
    expect(await hasPlatformAccess()).toBe(false);
    await prisma.client.delete({ where: { id: client.id } });
  });
});

describe("hasChatbotAccess", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns true only for isPlatformOwner", async () => {
    const client = await prisma.client.create({
      data: { clerkOrganizationId: `test-hca-owner-${Date.now()}`, businessName: "Owner", isPlatformOwner: true },
    });
    mockAuth.mockResolvedValue({ orgId: client.clerkOrganizationId });
    const { hasChatbotAccess } = await import("@/lib/auth/resolve-client");
    expect(await hasChatbotAccess()).toBe(true);
    await prisma.client.delete({ where: { id: client.id } });
  });

  it("returns false for isReseller", async () => {
    const client = await prisma.client.create({
      data: { clerkOrganizationId: `test-hca-reseller-${Date.now()}`, businessName: "Reseller", isReseller: true },
    });
    mockAuth.mockResolvedValue({ orgId: client.clerkOrganizationId });
    const { hasChatbotAccess } = await import("@/lib/auth/resolve-client");
    expect(await hasChatbotAccess()).toBe(false);
    await prisma.client.delete({ where: { id: client.id } });
  });
});
```

- [ ] **Step 2: Update `get-platform-client-id.test.ts` — rename fixture field**

Replace every occurrence of `isPlatformClient` with `isPlatformOwner` in the file:

```typescript
// Line 26 — change:
isPlatformClient: true,
// to:
isPlatformOwner: true,

// Line 42 — change:
expect(row?.isPlatformClient).toBe(true);
// to:
expect(row?.isPlatformOwner).toBe(true);
```

- [ ] **Step 3: Update `clerk-organizations.test.ts` — rename assertion field**

```typescript
// Line 22 — change:
expect(row?.isPlatformClient).toBe(false);
// to:
expect(row?.isPlatformOwner).toBe(false);

// Line 64 — change:
expect(row?.isPlatformClient).toBe(true);
// to:
expect(row?.isPlatformOwner).toBe(true);

// Line 72 — change:
expect(second?.isPlatformClient).toBe(false);
// to:
expect(second?.isPlatformOwner).toBe(false);
```

- [ ] **Step 4: Run all auth + webhook tests**

```bash
bun test tests/unit/auth/ tests/unit/webhooks/
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add tests/unit/auth/ tests/unit/webhooks/
git commit -m "test: update fixtures and assertions for isPlatformOwner rename + new helpers"
```

---

## Task 5: Update `clerk-organizations.ts` webhook handler

**Files:**
- Modify: `lib/webhooks/clerk-organizations.ts`

- [ ] **Step 1: Replace `isPlatformClient` with `isPlatformOwner`**

```typescript
// lib/webhooks/clerk-organizations.ts — change line 40:
(await prisma.client.count({ where: { isPlatformClient: true } })) === 0;
// to:
(await prisma.client.count({ where: { isPlatformOwner: true } })) === 0;

// Change line 47:
...(shouldBootstrapPlatform ? { isPlatformClient: true } : {}),
// to:
...(shouldBootstrapPlatform ? { isPlatformOwner: true } : {}),
```

- [ ] **Step 2: Run webhook tests**

```bash
bun test tests/unit/webhooks/clerk-organizations.test.ts
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add lib/webhooks/clerk-organizations.ts
git commit -m "refactor: rename isPlatformClient → isPlatformOwner in clerk webhook handler"
```

---

## Task 6: Update automation layout guard

**Files:**
- Modify: `app/(marketing)/dashboard/automation/layout.tsx`

- [ ] **Step 1: Replace the layout with the simplified guard**

```typescript
// app/(marketing)/dashboard/automation/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { hasPlatformAccess, requireAuthOrSignIn, redirectToAccessRequired, resolveClientIdFromAuth } from "@/lib/auth";

interface AutomationLayoutProps {
  children: ReactNode;
}

export default async function AutomationLayout({ children }: AutomationLayoutProps) {
  await requireAuthOrSignIn();

  const clientId = await resolveClientIdFromAuth();
  if (!clientId) redirectToAccessRequired();

  if (!(await hasPlatformAccess())) redirect("/portal");

  return <>{children}</>;
}
```

Wait — check what the existing import path for guards is:

```typescript
// The existing file imports from specific paths, not a barrel:
import { redirectToAccessRequired, requireAuthOrSignIn } from "@/lib/auth/guards";
import { hasPlatformAccess, resolveClientIdFromAuth } from "@/lib/auth/resolve-client";
```

Full corrected file:

```typescript
// app/(marketing)/dashboard/automation/layout.tsx
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { redirectToAccessRequired, requireAuthOrSignIn } from "@/lib/auth/guards";
import { hasPlatformAccess, resolveClientIdFromAuth } from "@/lib/auth/resolve-client";

interface AutomationLayoutProps {
  children: ReactNode;
}

export default async function AutomationLayout({ children }: AutomationLayoutProps) {
  await requireAuthOrSignIn();

  const clientId = await resolveClientIdFromAuth();
  if (!clientId) redirectToAccessRequired();

  if (!(await hasPlatformAccess())) redirect("/portal");

  return <>{children}</>;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(marketing)/dashboard/automation/layout.tsx
git commit -m "refactor: simplify automation layout guard to use hasPlatformAccess"
```

---

## Task 7: New `/api/me/client-flags` endpoint

This lightweight endpoint lets the client-side nav know which experience to show.

**Files:**
- Create: `app/api/me/client-flags/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// app/api/me/client-flags/route.ts
import { resolveClientIdFromAuth } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";

export async function GET() {
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) {
    return Response.json({ isPlatformOwner: false, isReseller: false }, { status: 200 });
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { isPlatformOwner: true, isReseller: true },
  });

  return Response.json({
    isPlatformOwner: client?.isPlatformOwner ?? false,
    isReseller: client?.isReseller ?? false,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/me/client-flags/route.ts
git commit -m "feat: add /api/me/client-flags endpoint for client-side nav gating"
```

---

## Task 8: Update nav header

**Files:**
- Modify: `components/shared/nav-header.tsx`

- [ ] **Step 1: Replace the nav header with flag-aware version**

```typescript
// components/shared/nav-header.tsx
"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

type ClientFlags = { isPlatformOwner: boolean; isReseller: boolean };

export function NavHeader() {
  const pathname = usePathname();
  const [flags, setFlags] = useState<ClientFlags>({ isPlatformOwner: false, isReseller: false });

  useEffect(() => {
    fetch("/api/me/client-flags")
      .then((r) => r.json())
      .then((data: ClientFlags) => setFlags(data))
      .catch(() => {});
  }, []);

  if (pathname?.startsWith("/widget/")) return null;

  const hasPlatformAccess = flags.isPlatformOwner || flags.isReseller;

  return (
    <header className="flex h-16 items-center justify-between bg-muted/50 px-4 shadow-ambient backdrop-blur-sm md:px-6">
      <nav className="flex items-center gap-6">
        <Link href="/" className="text-foreground transition-colors hover:text-secondary">
          <Typography.Large>GRAFT TODAY</Typography.Large>
        </Link>

        {hasPlatformAccess && (
          <>
            <Link
              href="/dashboard/automation"
              className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/automation/queue"
              className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
            >
              Prospect Queue
            </Link>
            <Link
              href="/dashboard/automation/leads"
              className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
            >
              Draft Leads
            </Link>
          </>
        )}

        {flags.isPlatformOwner && (
          <Link
            href="/portal"
            className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
          >
            Portal
          </Link>
        )}

        {!hasPlatformAccess && (
          <Link
            href="/portal"
            className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
          >
            My Portal
          </Link>
        )}
      </nav>
      <div className="flex items-center gap-4">
        <ModeToggle />
        <Show when="signed-out">
          <SignInButton>
            <Button size="default" variant="ghost">
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton>
            <Button size="default" variant="default">
              Sign Up
            </Button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/shared/nav-header.tsx
git commit -m "feat: show automation nav for platform/reseller, portal nav for chatbot clients"
```

---

## Task 9: Provisioning script for resellers

**Files:**
- Create: `scripts/provision-reseller.ts`

- [ ] **Step 1: Create the script**

```typescript
// scripts/provision-reseller.ts
// Usage: bun scripts/provision-reseller.ts <clerkOrgId> <businessName>
// Example: bun scripts/provision-reseller.ts org_2abc123 "Acme Agency"
import prisma from "@/lib/db/prisma";

const [clerkOrgId, businessName] = process.argv.slice(2);

if (!clerkOrgId || !businessName) {
  console.error("Usage: bun scripts/provision-reseller.ts <clerkOrgId> <businessName>");
  process.exit(1);
}

const existing = await prisma.client.findUnique({
  where: { clerkOrganizationId: clerkOrgId },
});

if (existing) {
  const updated = await prisma.client.update({
    where: { clerkOrganizationId: clerkOrgId },
    data: { isReseller: true, businessName },
  });
  console.log(`Updated existing client → isReseller: true`);
  console.log(JSON.stringify({ id: updated.id, businessName: updated.businessName, isReseller: updated.isReseller }, null, 2));
} else {
  const created = await prisma.client.create({
    data: { clerkOrganizationId: clerkOrgId, businessName, isReseller: true },
  });
  console.log(`Created new reseller client`);
  console.log(JSON.stringify({ id: created.id, businessName: created.businessName, isReseller: created.isReseller }, null, 2));
}

await prisma.$disconnect();
```

- [ ] **Step 2: Test the script (dry run against dev DB)**

```bash
bun scripts/provision-reseller.ts org_test_dry_run "Test Agency"
```

Expected: prints JSON with `isReseller: true`. Then clean up:

```bash
bunx prisma studio
# or:
bun -e "import p from './lib/db/prisma'; await p.client.deleteMany({ where: { clerkOrganizationId: 'org_test_dry_run' } }); await p.\$disconnect();"
```

- [ ] **Step 3: Commit**

```bash
git add scripts/provision-reseller.ts
git commit -m "feat: add provision-reseller script for manual reseller onboarding"
```

---

## Task 10: Run full test suite

- [ ] **Step 1: Run all unit tests**

```bash
bun test tests/unit/
```

Expected: all pass. If any test references `isPlatformClient` or `isPlatformAdmin`, update it to use `isPlatformOwner` / `hasPlatformAccess`.

- [ ] **Step 2: Check for any remaining `isPlatformClient` or `isPlatformAdmin` references**

```bash
grep -r "isPlatformClient\|isPlatformAdmin" --include="*.ts" --include="*.tsx" .
```

Expected: no matches.

- [ ] **Step 3: Final commit if any stragglers were fixed**

```bash
git add -p
git commit -m "refactor: clean up remaining isPlatformClient/isPlatformAdmin references"
```

---

## Summary of what each tier sees after this plan

| User | `isPlatformOwner` | `isReseller` | Nav shows | Can access |
|---|---|---|---|---|
| Jaco | `true` | `false` | Dashboard + Queue + Leads + Portal | Everything |
| Reseller | `false` | `true` | Dashboard + Queue + Leads | Automation only, no chatbot |
| Chatbot client | `false` | `false` | My Portal | `/portal` only |
