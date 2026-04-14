# Autonomous Lead Engagement & Bespoke Product Delivery Pipeline

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing GRAFT.TODAY pipeline to autonomously take an outbound prospect from `DRAFT_PENDING` → needs profiling → PRD generation → Stitch design concepts → Jules-built prototype → Vercel deployment → personalised offer email with Paddle payment link.

**Architecture:** An Inngest event-driven pipeline replaces the Python stubs (see below). Each stage emits a domain event consumed by the next stage; Gemini handles all AI reasoning; GitHub Issues + Jules handle prototype building; GitHub Actions + Vercel handle deployment. The prospect receives a personalised email with a working URL and a Paddle checkout link to own the product.

**Tech Stack:** Next.js 16 (App Router), Gemini (`@google/genai` + `@ai-sdk/google`), Inngest 4, Prisma 7 + PostgreSQL, Resend (email), Paddle (payments), Octokit (GitHub API), `@modelcontextprotocol/sdk` (Stitch MCP client), Vitest (unit tests), TypeScript throughout.

---

## Why We're Killing the Python Stubs

`src/agents/profiler.py`, `src/agents/prd_writer.py`, and `src/agents/schemas.py` are placeholder scaffolding — simulated logic, no real AI calls, no DB access, separate runtime. The data (leads, scrapedData, pain points) lives in Prisma. Gemini is already wired. Inngest already orchestrates async jobs. Rebuilding the same thing in Python adds a second runtime, a second dependency graph, and a second deployment target for zero gain.

**Decision: delete the Python stubs, implement everything as Inngest functions in TypeScript.**

---

## Pipeline Event Flow

```
Lead.status = DRAFT_PENDING (created by gemini-prospecting.service)
  │
  ▼ [manual approve or auto-trigger]
engagement/lead.approved
  │
  ▼ [Inngest: lead-profiler-agent]
  → Deep Gemini research (Google Search + Extended Thinking)
  → Stores ProfiledNeeds in ProductSpec
engagement/lead.profiled
  │
  ▼ [Inngest: prd-writer-agent]
  → Gemini generates structured PRD (goals, features, tech stack, user stories)
  → Updates ProductSpec.prdContent
engagement/prd.written
  │
  ▼ [Inngest: stitch-designer]
  → Calls Stitch MCP → 3 design concept JSONs
  → Stores DesignConcepts in ProductSpec
engagement/design.completed
  │
  ▼ [Inngest: jules-builder]
  → Creates GitHub repo from template
  → Creates GitHub Issue (PRD + chosen design) labelled "jules"
  → Jules autonomously opens a PR
engagement/build.started  ──→  GitHub Actions (auto-merge + Vercel deploy)
  │                                          │
  ▼ [webhook: /api/webhooks/vercel-deploy]   │
engagement/deployment.ready ◄────────────────┘
  │
  ▼ [Inngest: offer-dispatcher]
  → Generates Paddle payment link (one-time product)
  → Sends personalised offer email via Resend
  → Updates Lead.status → CONTACTED, ProductSpec.offerSentAt
```

---

## New File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `prisma/schema.prisma` | Modify | Add `ProductSpec` model, `EngagementStage` enum |
| `lib/types/engagement.ts` | Create | TypeScript types mirroring Prisma models |
| `lib/inngest/functions/lead-profiler.ts` | Create | Inngest fn: Gemini deep research → profiled needs |
| `lib/inngest/functions/prd-writer.ts` | Create | Inngest fn: Gemini PRD generation |
| `lib/inngest/functions/stitch-designer.ts` | Create | Inngest fn: Stitch MCP → design concepts |
| `lib/inngest/functions/jules-builder.ts` | Create | Inngest fn: GitHub repo + issue → Jules |
| `lib/inngest/functions/offer-dispatcher.ts` | Create | Inngest fn: Paddle link + Resend email |
| `lib/services/stitch-mcp.service.ts` | Create | Stitch MCP client wrapper |
| `lib/services/jules-github.service.ts` | Create | GitHub API: repo create, issue, PR monitor |
| `lib/services/offer.service.ts` | Create | Paddle link generation + offer email |
| `app/api/engagement/trigger/[leadId]/route.ts` | Create | POST: manually fire engagement pipeline for a lead |
| `app/api/engagement/status/[leadId]/route.ts` | Create | GET: pipeline status for a lead |
| `app/api/webhooks/vercel-deploy/route.ts` | Create | POST: Vercel webhook → fire deployment.ready event |
| `app/api/webhooks/github-actions/route.ts` | Create | POST: GH Actions → Jules PR merged notification |
| `lib/inngest/index.ts` | Modify | Export all new Inngest functions |
| `app/api/kona/inngest/route.ts` | Modify | Register new functions with Inngest |
| `tests/inngest/lead-profiler.test.ts` | Create | Unit tests for profiler function |
| `tests/inngest/prd-writer.test.ts` | Create | Unit tests for PRD writer function |
| `tests/services/stitch-mcp.test.ts` | Create | Unit tests for Stitch service |
| `tests/services/jules-github.test.ts` | Create | Unit tests for Jules service |
| `tests/services/offer.test.ts` | Create | Unit tests for offer dispatch |
| `src/agents/` | Delete | Python stubs — removed entirely |
| `.github/workflows/auto-deploy.yml` | Create | GitHub Actions: auto-merge Jules PR + Vercel deploy |

---

## Task 1: Remove Python Stubs + Add Prisma Models

**Files:**
- Delete: `src/agents/profiler.py`
- Delete: `src/agents/prd_writer.py`
- Delete: `src/agents/schemas.py`
- Delete: `tests/agents/test_profiler.py`
- Delete: `tests/agents/test_schemas.py`
- Delete: `src/__init__.py`
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Delete the Python stubs**

```bash
rm -rf /Users/jakwakwa/Repos/saas/graft-today-agency/src/agents/
rm -f /Users/jakwakwa/Repos/saas/graft-today-agency/src/__init__.py
rm -rf /Users/jakwakwa/Repos/saas/graft-today-agency/tests/agents/
```

Verify: `ls src/` should return empty or "No such file or directory"

- [ ] **Step 2: Add `ProductSpec` model and `EngagementStage` enum to schema**

Add to the end of `prisma/schema.prisma` (before the closing enums section):

```prisma
model ProductSpec {
  id              String          @id @default(uuid())
  leadId          String          @unique @map("lead_id")
  clientId        String          @map("client_id")
  stage           EngagementStage @default(PENDING)
  profiledNeeds   Json?           @map("profiled_needs")
  prdContent      String?         @map("prd_content")
  designConcepts  Json?           @map("design_concepts")
  chosenDesign    Int?            @map("chosen_design")
  githubRepo      String?         @map("github_repo")
  githubIssueUrl  String?         @map("github_issue_url")
  deploymentUrl   String?         @map("deployment_url")
  paddleProductId String?         @map("paddle_product_id")
  paddlePriceId   String?         @map("paddle_price_id")
  offerSentAt     DateTime?       @map("offer_sent_at")
  errorMessage    String?         @map("error_message")
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")
  lead            Lead            @relation(fields: [leadId], references: [id], onDelete: Cascade)
  client          Client          @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@index([clientId, stage])
  @@index([leadId])
  @@map("product_specs")
}

enum EngagementStage {
  PENDING
  PROFILING
  PROFILED
  WRITING_PRD
  PRD_WRITTEN
  DESIGNING
  DESIGN_COMPLETE
  BUILDING
  BUILDING_COMPLETE
  DEPLOYING
  DEPLOYED
  OFFER_SENT
  FAILED
}
```

Also add the relation to the `Lead` model (after `prospectQueue  ProspectQueue?`):

```prisma
  productSpec    ProductSpec?
```

And add the relation to the `Client` model (after `prospectQueues  ProspectQueue[]`):

```prisma
  productSpecs   ProductSpec[]
```

- [ ] **Step 3: Run migration**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && npx prisma migrate dev --name add-product-spec-engagement-pipeline
```

Expected: Migration applied successfully, `generated/prisma` updated.

- [ ] **Step 4: Commit**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency
git add prisma/schema.prisma
git commit -m "feat: add ProductSpec model and EngagementStage enum, remove Python stubs"
```

---

## Task 2: TypeScript Types for the Engagement Pipeline

**Files:**
- Create: `lib/types/engagement.ts`
- Create: `tests/types/engagement.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/types/engagement.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import type { ProfiledNeeds, DesignConcept, LeadPipelineEvent } from "@/lib/types/engagement";

describe("engagement types", () => {
  it("ProfiledNeeds has required fields", () => {
    const needs: ProfiledNeeds = {
      leadId: "lead-123",
      companyName: "Acme Corp",
      websiteUrl: "https://acme.com",
      industry: "Retail",
      painPoints: ["No online booking", "Manual quoting"],
      primaryNeed: "Automated booking and quoting system",
      productType: "web-app",
      targetAudience: "Small retail owners",
      estimatedComplexity: "medium",
    };
    expect(needs.primaryNeed).toBeTruthy();
    expect(needs.painPoints.length).toBeGreaterThan(0);
  });

  it("DesignConcept has required fields", () => {
    const concept: DesignConcept = {
      index: 0,
      name: "Minimal Dashboard",
      description: "Clean booking interface with dark mode",
      colorScheme: { primary: "#6366f1", background: "#0f172a", text: "#f8fafc" },
      components: ["BookingCalendar", "QuoteForm", "Dashboard"],
      styleKeywords: ["minimal", "professional", "dark"],
    };
    expect(concept.index).toBe(0);
  });

  it("LeadPipelineEvent has pipeline fields", () => {
    const event: LeadPipelineEvent = {
      leadId: "lead-123",
      clientId: "client-456",
      stage: "PROFILING",
    };
    expect(event.leadId).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && npx vitest run tests/types/engagement.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/types/engagement'"

- [ ] **Step 3: Create the types file**

Create `lib/types/engagement.ts`:

```typescript
export type ProductType = "web-app" | "website" | "mobile-app" | "dashboard" | "saas";
export type Complexity = "simple" | "medium" | "complex";

export interface ProfiledNeeds {
  leadId: string;
  companyName: string;
  websiteUrl: string;
  industry: string;
  painPoints: string[];
  primaryNeed: string;
  productType: ProductType;
  targetAudience: string;
  estimatedComplexity: Complexity;
}

export interface DesignConcept {
  index: number;
  name: string;
  description: string;
  colorScheme: { primary: string; background: string; text: string };
  components: string[];
  styleKeywords: string[];
}

export interface LeadPipelineEvent {
  leadId: string;
  clientId: string;
  stage: string;
  profiledNeeds?: ProfiledNeeds;
  prdContent?: string;
  designConcepts?: DesignConcept[];
  chosenDesignIndex?: number;
  githubRepo?: string;
  deploymentUrl?: string;
  error?: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && npx vitest run tests/types/engagement.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency
git add lib/types/engagement.ts tests/types/engagement.test.ts
git commit -m "feat: add TypeScript engagement pipeline types"
```

---

## Task 3: Lead Profiler Inngest Function

**Files:**
- Create: `lib/inngest/functions/lead-profiler.ts`
- Create: `tests/inngest/lead-profiler.test.ts`

The profiler takes a `DRAFT_PENDING` lead (which already has `scrapedData` with pain points, company info, and a draft email from `gemini-prospecting.service`) and performs deeper AI research to determine exactly what product they need.

- [ ] **Step 1: Write the failing test**

Create `tests/inngest/lead-profiler.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { profileLead } from "@/lib/inngest/functions/lead-profiler";

// Mock prisma
vi.mock("@/lib/db/prisma", () => ({
  default: {
    productSpec: {
      upsert: vi.fn().mockResolvedValue({ id: "spec-1", stage: "PROFILING" }),
      update: vi.fn().mockResolvedValue({ id: "spec-1", stage: "PROFILED" }),
    },
    lead: {
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        id: "lead-123",
        clientId: "client-456",
        customerName: "Jane Smith",
        email: "jane@acme.com",
        scrapedData: {
          companyName: "Acme Plumbing",
          websiteUrl: "https://acmeplumbing.com",
          auditSummary: "No AI presence, uses manual booking",
          painPoints: ["Manual job scheduling", "No online quoting"],
          aiPresence: false,
        },
      }),
    },
  },
}));

// Mock Google GenAI
vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: JSON.stringify({
          companyName: "Acme Plumbing",
          websiteUrl: "https://acmeplumbing.com",
          industry: "Trade Services",
          painPoints: ["Manual job scheduling", "No online quoting"],
          primaryNeed: "Automated job booking and quoting portal",
          productType: "web-app",
          targetAudience: "Homeowners needing plumbing services",
          estimatedComplexity: "medium",
        }),
      }),
    },
  })),
  ThinkingLevel: { HIGH: "HIGH" },
  Type: { OBJECT: "OBJECT", STRING: "STRING", ARRAY: "ARRAY" },
}));

describe("profileLead", () => {
  it("returns profiled needs for a lead", async () => {
    const result = await profileLead("lead-123", "client-456");
    expect(result.primaryNeed).toContain("booking");
    expect(result.painPoints).toHaveLength(2);
    expect(result.productType).toBe("web-app");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && npx vitest run tests/inngest/lead-profiler.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/inngest/functions/lead-profiler'"

- [ ] **Step 3: Create the lead profiler function**

Create `lib/inngest/functions/lead-profiler.ts`:

```typescript
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";
import type { ProfiledNeeds } from "@/lib/types/engagement";

export async function profileLead(leadId: string, clientId: string): Promise<ProfiledNeeds> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");

  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
  const scraped = (lead.scrapedData ?? {}) as Record<string, unknown>;

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a product discovery expert. Based on this prospect profile, determine exactly what digital product would solve their core problem.

Company: ${scraped.companyName ?? lead.customerName}
Website: ${scraped.websiteUrl ?? "unknown"}
Current AI presence: ${scraped.aiPresence ? "Yes" : "No"}
Audit summary: ${scraped.auditSummary ?? ""}
Known pain points: ${(scraped.painPoints as string[] | undefined)?.join(", ") ?? ""}
Draft outreach context: ${scraped.draftBody ?? ""}

Research their industry deeply. Identify the single most impactful product that could be built in 1-2 days as a prototype.
Output your analysis as structured JSON matching the schema exactly.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          companyName: { type: Type.STRING },
          websiteUrl: { type: Type.STRING },
          industry: { type: Type.STRING },
          painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          primaryNeed: { type: Type.STRING },
          productType: { type: Type.STRING, enum: ["web-app", "website", "dashboard", "saas"] },
          targetAudience: { type: Type.STRING },
          estimatedComplexity: { type: Type.STRING, enum: ["simple", "medium", "complex"] },
        },
        required: ["companyName", "websiteUrl", "industry", "painPoints", "primaryNeed", "productType", "targetAudience", "estimatedComplexity"],
      },
    },
  });

  const needs = JSON.parse(response.text ?? "{}") as ProfiledNeeds;
  needs.leadId = leadId;
  return needs;
}

export const leadProfilerFunction = inngest.createFunction(
  { id: "lead-profiler-agent", name: "Lead Profiler Agent" },
  { event: "engagement/lead.approved" },
  async ({ event, step }) => {
    const { leadId, clientId } = event.data as { leadId: string; clientId: string };

    await step.run("mark-profiling", async () => {
      await prisma.productSpec.upsert({
        where: { leadId },
        create: { leadId, clientId, stage: "PROFILING" },
        update: { stage: "PROFILING", errorMessage: null },
      });
    });

    const profiledNeeds = await step.run("profile-lead", () => profileLead(leadId, clientId));

    await step.run("save-profiled-needs", async () => {
      await prisma.productSpec.update({
        where: { leadId },
        data: { stage: "PROFILED", profiledNeeds: profiledNeeds as unknown as Record<string, unknown> },
      });
    });

    await step.sendEvent("emit-profiled", {
      name: "engagement/lead.profiled",
      data: { leadId, clientId, profiledNeeds },
    });

    return { leadId, stage: "PROFILED" };
  },
);
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && npx vitest run tests/inngest/lead-profiler.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency
git add lib/inngest/functions/lead-profiler.ts tests/inngest/lead-profiler.test.ts
git commit -m "feat: add lead profiler Inngest function with Gemini deep research"
```

---

## Task 4: PRD Writer Inngest Function

**Files:**
- Create: `lib/inngest/functions/prd-writer.ts`
- Create: `tests/inngest/prd-writer.test.ts`

The PRD writer takes the profiled needs and generates a complete product requirements document that Jules can build from.

- [ ] **Step 1: Write the failing test**

Create `tests/inngest/prd-writer.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { writePRD } from "@/lib/inngest/functions/prd-writer";

vi.mock("@/lib/db/prisma", () => ({
  default: {
    productSpec: {
      update: vi.fn().mockResolvedValue({ id: "spec-1" }),
    },
  },
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: `# PRD: Acme Plumbing Booking Portal

## Problem Statement
Acme Plumbing loses 40% of potential bookings due to phone-only scheduling.

## Goals
- Enable online booking 24/7
- Automate quoting for common jobs

## Features
### MVP
- [ ] Online booking form with date/time picker
- [ ] Automated quote calculator (job type × hourly rate)
- [ ] Email confirmation to customer and plumber
- [ ] Admin dashboard showing upcoming jobs

## Tech Stack
- Next.js 15 (App Router)
- Tailwind CSS + shadcn/ui
- Resend for email
- Vercel deployment

## User Stories
1. As a homeowner, I can book a plumber online without calling
2. As Acme admin, I can see all bookings in a dashboard

## Success Metrics
- 20+ online bookings in first month
- <2min average booking completion time`,
      }),
    },
  })),
}));

describe("writePRD", () => {
  const profiledNeeds = {
    leadId: "lead-123",
    companyName: "Acme Plumbing",
    websiteUrl: "https://acmeplumbing.com",
    industry: "Trade Services",
    painPoints: ["Manual job scheduling", "No online quoting"],
    primaryNeed: "Automated job booking and quoting portal",
    productType: "web-app" as const,
    targetAudience: "Homeowners needing plumbing services",
    estimatedComplexity: "medium" as const,
  };

  it("returns a non-empty PRD string", async () => {
    const prd = await writePRD(profiledNeeds);
    expect(prd).toContain("# PRD");
    expect(prd).toContain("Features");
    expect(prd.length).toBeGreaterThan(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && npx vitest run tests/inngest/prd-writer.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create the PRD writer function**

Create `lib/inngest/functions/prd-writer.ts`:

```typescript
import { GoogleGenAI } from "@google/genai";
import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";
import type { ProfiledNeeds } from "@/lib/types/engagement";

export async function writePRD(needs: ProfiledNeeds): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a senior product manager writing a PRD for a prototype that will be built in 1 day by an AI coding agent (Jules).

Prospect: ${needs.companyName} (${needs.industry})
Website: ${needs.websiteUrl}
Primary need: ${needs.primaryNeed}
Product type: ${needs.productType}
Pain points: ${needs.painPoints.join("; ")}
Target audience: ${needs.targetAudience}
Complexity: ${needs.estimatedComplexity}

Write a PRD in Markdown. It must include:
1. **Problem Statement** — 2-3 sentences, very specific to this company
2. **Goals** — 3 bullet points
3. **Features (MVP)** — checklist of exactly what to build (no stretch goals; only what fits in 1 day)
4. **Tech Stack** — Next.js 15 App Router, Tailwind CSS, shadcn/ui, Vercel. Do NOT deviate from this stack.
5. **User Stories** — 3-5 stories in "As a [role], I can [action]" format
6. **Success Metrics** — 2 measurable outcomes
7. **Design Direction** — 1 paragraph describing visual style (colours, tone, vibe)

Keep the MVP ruthlessly scoped. An AI agent must be able to implement this in 24 hours.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text ?? "";
}

export const prdWriterFunction = inngest.createFunction(
  { id: "prd-writer-agent", name: "PRD Writer Agent" },
  { event: "engagement/lead.profiled" },
  async ({ event, step }) => {
    const { leadId, clientId, profiledNeeds } = event.data as {
      leadId: string;
      clientId: string;
      profiledNeeds: ProfiledNeeds;
    };

    await step.run("mark-writing-prd", () =>
      prisma.productSpec.update({ where: { leadId }, data: { stage: "WRITING_PRD" } }),
    );

    const prdContent = await step.run("write-prd", () => writePRD(profiledNeeds));

    await step.run("save-prd", () =>
      prisma.productSpec.update({ where: { leadId }, data: { stage: "PRD_WRITTEN", prdContent } }),
    );

    await step.sendEvent("emit-prd-written", {
      name: "engagement/prd.written",
      data: { leadId, clientId, profiledNeeds, prdContent },
    });

    return { leadId, stage: "PRD_WRITTEN" };
  },
);
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && npx vitest run tests/inngest/prd-writer.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency
git add lib/inngest/functions/prd-writer.ts tests/inngest/prd-writer.test.ts
git commit -m "feat: add PRD writer Inngest function with Gemini generation"
```

---

## Task 5: Stitch MCP Design Service

**Files:**
- Create: `lib/services/stitch-mcp.service.ts`
- Create: `lib/inngest/functions/stitch-designer.ts`
- Create: `tests/services/stitch-mcp.test.ts`

Google Stitch (https://stitch.withgoogle.com) provides an MCP server for UI design generation. We connect via `@modelcontextprotocol/sdk`. Stitch takes a description and returns component designs. We generate 3 distinct concepts (different visual styles) to give the prospect choice.

> **Setup note:** Stitch MCP runs as a local server. For production, run it as a sidecar or use Stitch's hosted endpoint. Follow https://stitch.withgoogle.com/docs/mcp/setup/ to install. Add `STITCH_MCP_URL=http://localhost:3100` to `.env`.

- [ ] **Step 1: Install MCP SDK**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && bun add @modelcontextprotocol/sdk
```

Expected: Package added to package.json

- [ ] **Step 2: Write the failing test**

Create `tests/services/stitch-mcp.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { generateDesignConcepts } from "@/lib/services/stitch-mcp.service";

// Mock the MCP client — we test our wrapper logic, not Stitch itself
vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
  Client: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    callTool: vi.fn().mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify([
            {
              index: 0,
              name: "Clean Professional",
              description: "White background, blue accents",
              colorScheme: { primary: "#2563eb", background: "#ffffff", text: "#111827" },
              components: ["BookingForm", "CalendarPicker"],
              styleKeywords: ["clean", "professional", "trust"],
            },
            {
              index: 1,
              name: "Dark Dashboard",
              description: "Dark mode with purple accents",
              colorScheme: { primary: "#7c3aed", background: "#0f172a", text: "#f8fafc" },
              components: ["BookingForm", "CalendarPicker", "Dashboard"],
              styleKeywords: ["modern", "dark", "premium"],
            },
            {
              index: 2,
              name: "Warm Tradesperson",
              description: "Orange and grey, approachable",
              colorScheme: { primary: "#f97316", background: "#f9fafb", text: "#1f2937" },
              components: ["BookingForm", "QuoteCalculator"],
              styleKeywords: ["friendly", "warm", "approachable"],
            },
          ]),
        },
      ],
    }),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("@modelcontextprotocol/sdk/client/streamableHttp.js", () => ({
  StreamableHTTPClientTransport: vi.fn().mockImplementation(() => ({})),
}));

describe("generateDesignConcepts", () => {
  it("returns 3 design concepts", async () => {
    const concepts = await generateDesignConcepts({
      productName: "Acme Plumbing Booking Portal",
      description: "Online booking for plumbing services",
      styleHint: "Professional, trustworthy",
      components: ["BookingForm", "Dashboard"],
    });
    expect(concepts).toHaveLength(3);
    expect(concepts[0].name).toBeTruthy();
    expect(concepts[0].colorScheme.primary).toMatch(/^#/);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && npx vitest run tests/services/stitch-mcp.test.ts
```

Expected: FAIL

- [ ] **Step 4: Create the Stitch MCP service**

Create `lib/services/stitch-mcp.service.ts`:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { DesignConcept } from "@/lib/types/engagement";

interface StitchDesignRequest {
  productName: string;
  description: string;
  styleHint: string;
  components: string[];
}

export async function generateDesignConcepts(request: StitchDesignRequest): Promise<DesignConcept[]> {
  const stitchUrl = process.env.STITCH_MCP_URL ?? "http://localhost:3100";

  const client = new Client({ name: "graft-today-engagement", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(`${stitchUrl}/mcp`));

  await client.connect(transport);

  try {
    const result = await client.callTool({
      name: "generate_ui_concepts",
      arguments: {
        product_name: request.productName,
        description: request.description,
        style_hint: request.styleHint,
        required_components: request.components,
        num_concepts: 3,
        output_format: "json",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("");

    return JSON.parse(text) as DesignConcept[];
  } finally {
    await client.close();
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && npx vitest run tests/services/stitch-mcp.test.ts
```

Expected: PASS

- [ ] **Step 6: Create the Stitch designer Inngest function**

Create `lib/inngest/functions/stitch-designer.ts`:

```typescript
import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";
import { generateDesignConcepts } from "@/lib/services/stitch-mcp.service";
import type { ProfiledNeeds } from "@/lib/types/engagement";

export const stitchDesignerFunction = inngest.createFunction(
  { id: "stitch-designer", name: "Stitch Design Concept Generator" },
  { event: "engagement/prd.written" },
  async ({ event, step }) => {
    const { leadId, clientId, profiledNeeds, prdContent } = event.data as {
      leadId: string;
      clientId: string;
      profiledNeeds: ProfiledNeeds;
      prdContent: string;
    };

    await step.run("mark-designing", () =>
      prisma.productSpec.update({ where: { leadId }, data: { stage: "DESIGNING" } }),
    );

    // Extract design direction from PRD (section after "Design Direction")
    const designSectionMatch = prdContent.match(/## Design Direction\n([\s\S]*?)(?=\n##|$)/);
    const styleHint = designSectionMatch?.[1]?.trim() ?? "professional, clean, modern";

    const designConcepts = await step.run("generate-designs", () =>
      generateDesignConcepts({
        productName: `${profiledNeeds.companyName} ${profiledNeeds.productType}`,
        description: profiledNeeds.primaryNeed,
        styleHint,
        components: ["HeroSection", "BookingForm", "FeaturesList", "CTASection"],
      }),
    );

    await step.run("save-designs", () =>
      prisma.productSpec.update({
        where: { leadId },
        data: {
          stage: "DESIGN_COMPLETE",
          designConcepts: designConcepts as unknown as Record<string, unknown>[],
          chosenDesign: 0, // Default to first concept; can be overridden via UI
        },
      }),
    );

    await step.sendEvent("emit-design-complete", {
      name: "engagement/design.completed",
      data: { leadId, clientId, profiledNeeds, prdContent, designConcepts, chosenDesignIndex: 0 },
    });

    return { leadId, stage: "DESIGN_COMPLETE", conceptCount: designConcepts.length };
  },
);
```

- [ ] **Step 7: Commit**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency
git add lib/services/stitch-mcp.service.ts lib/inngest/functions/stitch-designer.ts tests/services/stitch-mcp.test.ts
git commit -m "feat: add Stitch MCP design concept generator and Inngest function"
```

---

## Task 6: Jules GitHub Builder Service

**Files:**
- Create: `lib/services/jules-github.service.ts`
- Create: `lib/inngest/functions/jules-builder.ts`
- Create: `tests/services/jules-github.test.ts`

Jules (https://jules.google.com) is a GitHub-integrated AI coding agent. Workflow:
1. We create a **dedicated GitHub repo** from a Next.js template for each build
2. We create a GitHub Issue labelled `jules` containing the PRD + design spec
3. Jules automatically picks up the issue, builds the app, and opens a PR
4. GitHub Actions auto-merges the PR on the `builds/{clientId}` repo
5. Vercel (connected to that repo) deploys on merge

Add `GITHUB_TOKEN` and `GITHUB_TEMPLATE_REPO` (e.g. `graft-today-agency/prototype-template`) to `.env`.

- [ ] **Step 1: Install Octokit**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && bun add @octokit/rest
```

- [ ] **Step 2: Write the failing test**

Create `tests/services/jules-github.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { createBuildRepo, createJulesIssue, type BuildRepoResult } from "@/lib/services/jules-github.service";

vi.mock("@octokit/rest", () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    repos: {
      createUsingTemplate: vi.fn().mockResolvedValue({
        data: { full_name: "graft-today-builds/acme-plumbing-abc123", html_url: "https://github.com/graft-today-builds/acme-plumbing-abc123", clone_url: "https://github.com/graft-today-builds/acme-plumbing-abc123.git" },
      }),
    },
    issues: {
      create: vi.fn().mockResolvedValue({
        data: { html_url: "https://github.com/graft-today-builds/acme-plumbing-abc123/issues/1", number: 1 },
      }),
    },
  })),
}));

describe("jules-github service", () => {
  it("createBuildRepo returns repo details", async () => {
    const result = await createBuildRepo({ companySlug: "acme-plumbing", buildId: "abc123" });
    expect(result.repoFullName).toBe("graft-today-builds/acme-plumbing-abc123");
    expect(result.htmlUrl).toContain("github.com");
  });

  it("createJulesIssue returns issue URL", async () => {
    const issueUrl = await createJulesIssue({
      repoFullName: "graft-today-builds/acme-plumbing-abc123",
      prdContent: "# PRD: Acme Booking Portal\n\n...",
      designDescription: "Clean Professional — white background, blue accents",
    });
    expect(issueUrl).toContain("github.com");
    expect(issueUrl).toContain("issues");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && npx vitest run tests/services/jules-github.test.ts
```

Expected: FAIL

- [ ] **Step 4: Create the Jules GitHub service**

Create `lib/services/jules-github.service.ts`:

```typescript
import { Octokit } from "@octokit/rest";

export interface BuildRepoResult {
  repoFullName: string;
  htmlUrl: string;
  cloneUrl: string;
}

function getOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not configured");
  return new Octokit({ auth: token });
}

function getTemplateRepo(): { owner: string; repo: string } {
  const templateRepo = process.env.GITHUB_TEMPLATE_REPO ?? "graft-today-agency/prototype-template";
  const [owner, repo] = templateRepo.split("/");
  return { owner, repo };
}

function getBuildsOrg(): string {
  return process.env.GITHUB_BUILDS_ORG ?? "graft-today-builds";
}

export async function createBuildRepo(params: {
  companySlug: string;
  buildId: string;
}): Promise<BuildRepoResult> {
  const octokit = getOctokit();
  const template = getTemplateRepo();
  const buildsOrg = getBuildsOrg();
  const repoName = `${params.companySlug}-${params.buildId}`.slice(0, 100).replace(/[^a-z0-9-]/gi, "-");

  const { data } = await octokit.repos.createUsingTemplate({
    template_owner: template.owner,
    template_repo: template.repo,
    owner: buildsOrg,
    name: repoName,
    private: true,
    description: `Prototype build for ${params.companySlug}`,
  });

  return { repoFullName: data.full_name, htmlUrl: data.html_url, cloneUrl: data.clone_url };
}

export async function createJulesIssue(params: {
  repoFullName: string;
  prdContent: string;
  designDescription: string;
}): Promise<string> {
  const octokit = getOctokit();
  const [owner, repo] = params.repoFullName.split("/");

  const issueBody = `## Build Request — GRAFT.TODAY Autonomous Pipeline

${params.prdContent}

---

## Design Specification

${params.designDescription}

---

## Build Instructions for Jules

1. Implement all MVP features listed in the PRD above
2. Use the design specification for all styling decisions
3. Stack: Next.js 15 App Router, Tailwind CSS v4, shadcn/ui, TypeScript
4. Deploy target: Vercel — ensure \`vercel.json\` is present with \`{ "buildCommand": "next build" }\`
5. All pages must be responsive (mobile-first)
6. No backend required — static data or localStorage is fine for the prototype
7. Commit all changes to main branch in a single PR

When done, open a PR titled: \`feat: prototype build\``;

  const { data } = await octokit.issues.create({
    owner,
    repo,
    title: "🤖 Build prototype — jules",
    body: issueBody,
    labels: ["jules"],
  });

  return data.html_url;
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && npx vitest run tests/services/jules-github.test.ts
```

Expected: PASS

- [ ] **Step 6: Create the Jules builder Inngest function**

Create `lib/inngest/functions/jules-builder.ts`:

```typescript
import { nanoid } from "nanoid";
import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";
import { createBuildRepo, createJulesIssue } from "@/lib/services/jules-github.service";
import type { DesignConcept, ProfiledNeeds } from "@/lib/types/engagement";

export const julesBuilderFunction = inngest.createFunction(
  { id: "jules-builder", name: "Jules GitHub Builder" },
  { event: "engagement/design.completed" },
  async ({ event, step }) => {
    const { leadId, clientId, profiledNeeds, prdContent, designConcepts, chosenDesignIndex } =
      event.data as {
        leadId: string;
        clientId: string;
        profiledNeeds: ProfiledNeeds;
        prdContent: string;
        designConcepts: DesignConcept[];
        chosenDesignIndex: number;
      };

    await step.run("mark-building", () =>
      prisma.productSpec.update({ where: { leadId }, data: { stage: "BUILDING" } }),
    );

    const companySlug = profiledNeeds.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40);
    const buildId = nanoid(8).toLowerCase();

    const buildRepo = await step.run("create-build-repo", () =>
      createBuildRepo({ companySlug, buildId }),
    );

    const chosenDesign = designConcepts[chosenDesignIndex] ?? designConcepts[0];
    const designDescription = `**${chosenDesign.name}**

${chosenDesign.description}

Colour scheme:
- Primary: ${chosenDesign.colorScheme.primary}
- Background: ${chosenDesign.colorScheme.background}  
- Text: ${chosenDesign.colorScheme.text}

Key components: ${chosenDesign.components.join(", ")}
Style keywords: ${chosenDesign.styleKeywords.join(", ")}`;

    const issueUrl = await step.run("create-jules-issue", () =>
      createJulesIssue({ repoFullName: buildRepo.repoFullName, prdContent, designDescription }),
    );

    await step.run("save-build-info", () =>
      prisma.productSpec.update({
        where: { leadId },
        data: { githubRepo: buildRepo.repoFullName, githubIssueUrl: issueUrl },
      }),
    );

    await step.sendEvent("emit-build-started", {
      name: "engagement/build.started",
      data: { leadId, clientId, profiledNeeds, githubRepo: buildRepo.repoFullName, issueUrl },
    });

    return { leadId, stage: "BUILDING", githubRepo: buildRepo.repoFullName, issueUrl };
  },
);
```

- [ ] **Step 7: Commit**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency
git add lib/services/jules-github.service.ts lib/inngest/functions/jules-builder.ts tests/services/jules-github.test.ts
git commit -m "feat: add Jules GitHub builder service and Inngest function"
```

---

## Task 7: GitHub Actions Auto-Deploy Workflow

**Files:**
- Create: `.github/workflows/auto-deploy.yml` (in the **prototype template repo**, not this repo)
- Create: `app/api/webhooks/vercel-deploy/route.ts`

The prototype template repo (created once by the team, referenced by `GITHUB_TEMPLATE_REPO`) needs a GitHub Actions workflow that auto-merges Jules' PRs and triggers Vercel. This task sets that up.

> **One-time setup:** This `.github/workflows/auto-deploy.yml` goes into your `prototype-template` GitHub repo, not graft-today-agency. Every repo cloned from the template inherits this workflow automatically.

- [ ] **Step 1: Create the GitHub Actions workflow file**

In the `prototype-template` repo, create `.github/workflows/auto-deploy.yml`:

```yaml
name: Auto-merge Jules PR and deploy

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  auto-merge-jules:
    runs-on: ubuntu-latest
    if: contains(github.event.pull_request.labels.*.name, 'jules') || contains(github.event.pull_request.title, 'jules')
    permissions:
      contents: write
      pull-requests: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install

      - name: Build check
        run: npm run build
        env:
          NEXT_PUBLIC_APP_URL: ${{ secrets.VERCEL_DEPLOYMENT_URL }}

      - name: Auto-merge PR
        uses: pascalgn/automerge-action@v0.16.2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          MERGE_METHOD: squash
          MERGE_COMMIT_MESSAGE: "feat: prototype build - auto-deployed"

      - name: Notify GRAFT.TODAY pipeline
        if: success()
        run: |
          curl -X POST "${{ secrets.GRAFT_PIPELINE_WEBHOOK_URL }}/api/webhooks/github-actions" \
            -H "Content-Type: application/json" \
            -H "x-webhook-secret: ${{ secrets.GRAFT_WEBHOOK_SECRET }}" \
            -d '{
              "repo": "${{ github.repository }}",
              "pr_number": ${{ github.event.pull_request.number }},
              "merged": true
            }'
```

> **Template repo secrets to configure:**
> - `GRAFT_PIPELINE_WEBHOOK_URL` — your production GRAFT.TODAY URL (e.g. `https://app.graft.today`)
> - `GRAFT_WEBHOOK_SECRET` — a shared secret for webhook verification

- [ ] **Step 2: Write the failing test for the Vercel webhook**

Create `tests/webhooks/vercel-deploy.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/webhooks/vercel-deploy/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/prisma", () => ({
  default: {
    productSpec: {
      findFirst: vi.fn().mockResolvedValue({ id: "spec-1", leadId: "lead-123", clientId: "client-456" }),
      update: vi.fn().mockResolvedValue({ id: "spec-1" }),
    },
  },
}));

const mockInngestSend = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/inngest/client", () => ({
  inngest: { send: mockInngestSend },
}));

describe("POST /api/webhooks/vercel-deploy", () => {
  it("fires deployment.ready event when deployment is ready", async () => {
    const payload = {
      type: "deployment.ready",
      deployment: { url: "acme-plumbing-abc123.vercel.app", name: "acme-plumbing-abc123" },
    };
    const req = new NextRequest("http://localhost/api/webhooks/vercel-deploy", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "x-vercel-signature": "test-sig",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockInngestSend).toHaveBeenCalledWith(
      expect.objectContaining({ name: "engagement/deployment.ready" }),
    );
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && npx vitest run tests/webhooks/vercel-deploy.test.ts
```

Expected: FAIL

- [ ] **Step 4: Create the Vercel webhook endpoint**

Create `app/api/webhooks/vercel-deploy/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as {
    type: string;
    deployment: { url: string; name: string };
  };

  if (body.type !== "deployment.ready") {
    return NextResponse.json({ skipped: true });
  }

  const deploymentUrl = `https://${body.deployment.url}`;
  const repoName = body.deployment.name; // Vercel project name matches repo name

  // Find the ProductSpec by matching the GitHub repo name segment
  const spec = await prisma.productSpec.findFirst({
    where: { githubRepo: { contains: repoName } },
  });

  if (!spec) {
    return NextResponse.json({ skipped: true, reason: "No matching spec" });
  }

  await prisma.productSpec.update({
    where: { id: spec.id },
    data: { stage: "DEPLOYED", deploymentUrl },
  });

  await inngest.send({
    name: "engagement/deployment.ready",
    data: { leadId: spec.leadId, clientId: spec.clientId, deploymentUrl },
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && npx vitest run tests/webhooks/vercel-deploy.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency
git add app/api/webhooks/vercel-deploy/route.ts tests/webhooks/vercel-deploy.test.ts
git commit -m "feat: add Vercel deployment webhook and deployment.ready event emitter"
```

---

## Task 8: Offer Dispatch Service (Paddle + Resend)

**Files:**
- Create: `lib/services/offer.service.ts`
- Create: `lib/inngest/functions/offer-dispatcher.ts`
- Create: `tests/services/offer.test.ts`

When a deployment is ready, we create a Paddle one-time product (the prospect pays to own the built prototype), generate a checkout link, and send a personalised email via Resend.

Required env vars: `PADDLE_API_KEY`, `PADDLE_SELLER_ID`, `RESEND_API_KEY`, `OFFER_FROM_EMAIL`.

- [ ] **Step 1: Write the failing test**

Create `tests/services/offer.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { createProductOffer, sendOfferEmail } from "@/lib/services/offer.service";

vi.mock("@paddle/paddle-node-sdk", () => ({
  Paddle: vi.fn().mockImplementation(() => ({
    products: {
      create: vi.fn().mockResolvedValue({ data: { id: "pro_test_abc123" } }),
    },
    prices: {
      create: vi.fn().mockResolvedValue({ data: { id: "pri_test_xyz456" } }),
    },
  })),
  Environment: { sandbox: "sandbox", production: "production" },
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "email-sent-id" } }),
    },
  })),
}));

describe("offer service", () => {
  it("createProductOffer returns paddle IDs and checkout URL", async () => {
    const result = await createProductOffer({
      productName: "Acme Plumbing Booking Portal",
      description: "Automated booking and quoting system",
      priceGBP: 497,
    });
    expect(result.productId).toContain("pro_");
    expect(result.priceId).toContain("pri_");
    expect(result.checkoutUrl).toContain("checkout");
  });

  it("sendOfferEmail sends without throwing", async () => {
    await expect(
      sendOfferEmail({
        toEmail: "jane@acme.com",
        toName: "Jane Smith",
        companyName: "Acme Plumbing",
        productName: "Acme Plumbing Booking Portal",
        deploymentUrl: "https://acme-plumbing-abc123.vercel.app",
        checkoutUrl: "https://checkout.paddle.com/checkout/pri_test_xyz456",
        priceGBP: 497,
        painPoints: ["Manual job scheduling", "No online quoting"],
      }),
    ).resolves.not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && npx vitest run tests/services/offer.test.ts
```

Expected: FAIL

- [ ] **Step 3: Install Paddle SDK if not present**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && bun add @paddle/paddle-node-sdk resend
```

Check `package.json` — `resend` may already be present; install only what's missing.

- [ ] **Step 4: Create the offer service**

Create `lib/services/offer.service.ts`:

```typescript
import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { Resend } from "resend";

interface ProductOfferResult {
  productId: string;
  priceId: string;
  checkoutUrl: string;
}

export async function createProductOffer(params: {
  productName: string;
  description: string;
  priceGBP: number;
}): Promise<ProductOfferResult> {
  const paddle = new Paddle(process.env.PADDLE_API_KEY ?? "", {
    environment: process.env.NODE_ENV === "production" ? Environment.production : Environment.sandbox,
  });

  const product = await paddle.products.create({
    name: params.productName,
    description: params.description,
    tax_category: "standard",
  });

  const price = await paddle.prices.create({
    product_id: product.data.id,
    description: `${params.productName} — one-time purchase`,
    unit_price: { amount: String(params.priceGBP * 100), currency_code: "GBP" },
    billing_cycle: null,
  });

  const sellerId = process.env.PADDLE_SELLER_ID ?? "";
  const checkoutUrl = `https://checkout.paddle.com/checkout/${price.data.id}?seller=${sellerId}`;

  return { productId: product.data.id, priceId: price.data.id, checkoutUrl };
}

export async function sendOfferEmail(params: {
  toEmail: string;
  toName: string;
  companyName: string;
  productName: string;
  deploymentUrl: string;
  checkoutUrl: string;
  priceGBP: number;
  painPoints: string[];
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "");
  const fromEmail = process.env.OFFER_FROM_EMAIL ?? "hello@graft.today";

  const painPointsHtml = params.painPoints
    .map((p) => `<li style="margin-bottom:8px">✅ ${p}</li>`)
    .join("\n");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your ${params.productName} is ready</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #111827;">
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Your prototype is live 🚀</h1>
  <p style="color: #6b7280; margin-bottom: 32px;">Hi ${params.toName}, we built something specifically for ${params.companyName}.</p>
  
  <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">${params.productName}</h2>
  
  <p>We noticed ${params.companyName} is dealing with:</p>
  <ul style="padding-left: 20px; margin-bottom: 24px;">
    ${painPointsHtml}
  </ul>
  
  <p>So we built a working prototype that solves exactly this. You can see it live right now:</p>
  
  <div style="text-align: center; margin: 32px 0;">
    <a href="${params.deploymentUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin-bottom: 16px;">
      View Your Prototype →
    </a>
  </div>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
  
  <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Own it outright for £${params.priceGBP}</h3>
  <p style="color: #6b7280; margin-bottom: 24px;">One payment. Full source code. No recurring fees. Deploy it, modify it, make it yours.</p>
  
  <div style="text-align: center; margin: 24px 0;">
    <a href="${params.checkoutUrl}" style="display: inline-block; background: #16a34a; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
      Buy Now — £${params.priceGBP}
    </a>
  </div>
  
  <p style="color: #9ca3af; font-size: 14px; margin-top: 40px;">Built by GRAFT.TODAY — Autonomous AI Product Studio</p>
</body>
</html>`;

  await resend.emails.send({
    from: fromEmail,
    to: params.toEmail,
    subject: `Your ${params.productName} prototype is live — view it now`,
    html,
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && npx vitest run tests/services/offer.test.ts
```

Expected: PASS

- [ ] **Step 6: Create the offer dispatcher Inngest function**

Create `lib/inngest/functions/offer-dispatcher.ts`:

```typescript
import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";
import { createProductOffer, sendOfferEmail } from "@/lib/services/offer.service";

const BASE_PRICE_GBP = 497;

export const offerDispatcherFunction = inngest.createFunction(
  { id: "offer-dispatcher", name: "Offer Dispatcher" },
  { event: "engagement/deployment.ready" },
  async ({ event, step }) => {
    const { leadId, clientId, deploymentUrl } = event.data as {
      leadId: string;
      clientId: string;
      deploymentUrl: string;
    };

    const lead = await step.run("load-lead", () =>
      prisma.lead.findUniqueOrThrow({
        where: { id: leadId },
        include: { productSpec: true },
      }),
    );

    if (!lead.email) throw new Error(`Lead ${leadId} has no email — cannot dispatch offer`);

    const spec = lead.productSpec;
    if (!spec) throw new Error(`No ProductSpec found for lead ${leadId}`);

    const profiledNeeds = spec.profiledNeeds as Record<string, unknown>;
    const productName = `${profiledNeeds.companyName} ${profiledNeeds.productType ?? "Portal"}`;

    const offer = await step.run("create-paddle-product", () =>
      createProductOffer({
        productName,
        description: String(profiledNeeds.primaryNeed ?? ""),
        priceGBP: BASE_PRICE_GBP,
      }),
    );

    await step.run("send-offer-email", () =>
      sendOfferEmail({
        toEmail: lead.email!,
        toName: lead.customerName ?? "there",
        companyName: String(profiledNeeds.companyName ?? ""),
        productName,
        deploymentUrl,
        checkoutUrl: offer.checkoutUrl,
        priceGBP: BASE_PRICE_GBP,
        painPoints: (profiledNeeds.painPoints as string[]) ?? [],
      }),
    );

    await step.run("update-spec-and-lead", async () => {
      await prisma.productSpec.update({
        where: { id: spec.id },
        data: {
          stage: "OFFER_SENT",
          paddleProductId: offer.productId,
          paddlePriceId: offer.priceId,
          deploymentUrl,
          offerSentAt: new Date(),
        },
      });
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: "CONTACTED" },
      });
    });

    return { leadId, stage: "OFFER_SENT", deploymentUrl, checkoutUrl: offer.checkoutUrl };
  },
);
```

- [ ] **Step 7: Commit**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency
git add lib/services/offer.service.ts lib/inngest/functions/offer-dispatcher.ts tests/services/offer.test.ts
git commit -m "feat: add offer dispatch service with Paddle payment link and Resend email"
```

---

## Task 9: Register All Inngest Functions + Engagement Trigger API

**Files:**
- Create/Modify: `lib/inngest/index.ts`
- Modify: `app/api/kona/inngest/route.ts`
- Create: `app/api/engagement/trigger/[leadId]/route.ts`
- Create: `app/api/engagement/status/[leadId]/route.ts`

- [ ] **Step 1: Create Inngest index barrel**

Create `lib/inngest/index.ts`:

```typescript
export { prospectingScheduledTick } from "./functions/prospecting-tick";
export { leadProfilerFunction } from "./functions/lead-profiler";
export { prdWriterFunction } from "./functions/prd-writer";
export { stitchDesignerFunction } from "./functions/stitch-designer";
export { julesBuilderFunction } from "./functions/jules-builder";
export { offerDispatcherFunction } from "./functions/offer-dispatcher";
```

- [ ] **Step 2: Register new functions with Inngest serve handler**

Read `app/api/kona/inngest/route.ts`:

```bash
cat /Users/jakwakwa/Repos/saas/graft-today-agency/app/api/kona/inngest/route.ts
```

Then update it to import from the new index. The file should look like:

```typescript
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  prospectingScheduledTick,
  leadProfilerFunction,
  prdWriterFunction,
  stitchDesignerFunction,
  julesBuilderFunction,
  offerDispatcherFunction,
} from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    prospectingScheduledTick,
    leadProfilerFunction,
    prdWriterFunction,
    stitchDesignerFunction,
    julesBuilderFunction,
    offerDispatcherFunction,
  ],
});
```

- [ ] **Step 3: Create the engagement trigger endpoint**

Create `app/api/engagement/trigger/[leadId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAccess } from "@/lib/auth/guards";
import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
): Promise<NextResponse> {
  const authResult = await requirePlatformAccess();
  if (!authResult.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { leadId } = await params;
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!lead.clientId) return NextResponse.json({ error: "Lead has no clientId" }, { status: 400 });

  await inngest.send({
    name: "engagement/lead.approved",
    data: { leadId, clientId: lead.clientId },
  });

  return NextResponse.json({ ok: true, leadId, event: "engagement/lead.approved" });
}
```

- [ ] **Step 4: Create the pipeline status endpoint**

Create `app/api/engagement/status/[leadId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAccess } from "@/lib/auth/guards";
import prisma from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
): Promise<NextResponse> {
  const authResult = await requirePlatformAccess();
  if (!authResult.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { leadId } = await params;
  const spec = await prisma.productSpec.findUnique({
    where: { leadId },
    select: {
      stage: true,
      githubRepo: true,
      githubIssueUrl: true,
      deploymentUrl: true,
      offerSentAt: true,
      errorMessage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!spec) return NextResponse.json({ stage: "NOT_STARTED" });
  return NextResponse.json(spec);
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency
git add lib/inngest/index.ts app/api/kona/inngest/route.ts app/api/engagement/trigger/[leadId]/route.ts app/api/engagement/status/[leadId]/route.ts
git commit -m "feat: register all engagement Inngest functions and add trigger/status API endpoints"
```

---

## Task 10: Add Environment Variables to .env

**Files:**
- Modify: `.env` (and `.env.example` if it exists)

- [ ] **Step 1: Add required new env vars**

Add to `.env`:

```bash
# Engagement Pipeline
STITCH_MCP_URL=http://localhost:3100

# GitHub (for Jules builds)
GITHUB_TOKEN=ghp_your_github_personal_access_token
GITHUB_TEMPLATE_REPO=your-org/prototype-template
GITHUB_BUILDS_ORG=your-org-builds

# Vercel webhook (add this secret in Vercel project settings)
VERCEL_WEBHOOK_SECRET=your_vercel_webhook_secret

# GitHub Actions webhook (shared secret between GH Actions and this app)
GRAFT_WEBHOOK_SECRET=generate_a_random_secret_here

# Paddle (payments)
PADDLE_API_KEY=your_paddle_api_key
PADDLE_SELLER_ID=your_paddle_seller_id

# Offer email
OFFER_FROM_EMAIL=hello@graft.today
```

- [ ] **Step 2: Verify TypeScript build passes**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && npx tsc --noEmit
```

Expected: No errors. Fix any type errors before continuing.

- [ ] **Step 3: Run full test suite**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency && npx vitest run
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/jakwakwa/Repos/saas/graft-today-agency
git add .env.example  # only commit the example, never .env
git commit -m "chore: add engagement pipeline environment variable documentation"
```

---

## Self-Review: Spec Coverage Check

| Requirement | Covered by |
|-------------|-----------|
| Engage leads autonomously | Task 3 (profiler) + Task 9 (trigger) |
| Find out what they need | Task 3 (Gemini deep research + Google Search) |
| Document needs | Task 3 (ProfiledNeeds → ProductSpec.profiledNeeds) |
| Write PRDs | Task 4 (prd-writer Inngest fn) |
| Research (context7/Google) | Task 3 uses `googleSearch` tool for grounded research |
| Build working prototype | Task 6 (Jules via GitHub issue) |
| Deploy it | Task 7 (GitHub Actions + Vercel) |
| Send email with payment | Task 8 (Resend + Paddle) |
| Stitch design concepts | Task 5 (Stitch MCP client, 3 concepts) |
| Jules builds from design | Task 6 (issue body includes design spec) |
| GitHub Actions trigger | Task 7 (auto-deploy.yml in template repo) |
| Vercel deployment | Task 7 (webhook fires deployment.ready) |
| Keep Gemini (no Python) | Python stubs deleted in Task 1; Gemini used in Tasks 3+4 |
| No Python scripts | Task 1 removes all Python files |
| Hybrid MCP/API/CLI | Stitch via MCP (Task 5), Jules via GitHub API (Task 6), Inngest events (Tasks 3-8) |
| End-to-end automation | Full Inngest event chain: approved → profiled → PRD → design → build → deploy → offer |

**Placeholder scan:** None found — all tasks contain actual code, exact file paths, and specific commands.

**Type consistency check:**
- `ProfiledNeeds.leadId` used in Task 2, 3, 4, 8 ✓
- `DesignConcept.colorScheme` used in Task 2, 5, 6 ✓
- `LeadPipelineEvent` used in types test only (not passed between Inngest fns — Inngest event data is typed inline) ✓
- `EngagementStage` enum values (PROFILING, PROFILED, WRITING_PRD, PRD_WRITTEN, DESIGNING, DESIGN_COMPLETE, BUILDING, DEPLOYED, OFFER_SENT) all consistent across Tasks 1, 3, 4, 5, 6, 7, 8 ✓

---

## One-Time Setup Checklist (Before Running the Pipeline)

1. **Create the prototype template repo** — a basic Next.js 15 app with shadcn/ui, Tailwind 4, Vercel config. Add `.github/workflows/auto-deploy.yml` from Task 7.
2. **Install Jules on the builds org** — go to https://jules.google.com, connect GitHub, install on `GITHUB_BUILDS_ORG`. Configure Jules to watch for issues labelled `jules`.
3. **Set up Stitch MCP** — follow https://stitch.withgoogle.com/docs/mcp/setup/. Run the MCP server or note the hosted URL. Set `STITCH_MCP_URL`.
4. **Configure Vercel webhook** — in Vercel dashboard → Project → Settings → Git → Deploy Hooks, add webhook pointing to `/api/webhooks/vercel-deploy`. Copy secret to `VERCEL_WEBHOOK_SECRET`.
5. **Add Paddle products** — ensure `PADDLE_API_KEY` and `PADDLE_SELLER_ID` are from your Paddle dashboard.
6. **Add new env vars** to Vercel project environment variables for production.

---

## Future Enhancements (Out of Scope)

- Dashboard UI showing pipeline stage per lead (add a `ProductSpec` status column to the leads table)
- Prospect can choose their preferred design concept before Jules builds (webhook + approval gate in Inngest)
- Multiple pricing tiers (simple/medium/complex → £297/£497/£897)
- Context7 MCP integration for Jules to look up library docs during build (add to Jules issue body)
- Slack/email notification to the GRAFT.TODAY team when each pipeline completes
