// Synthetic lead harness for the engagement pipeline (Bun).
// Start: bun scripts/dry-run-engagement.ts
// Cleanup: bun scripts/dry-run-engagement.ts --cleanup <leadId>
// Requires: DATABASE_URL, INNGEST_EVENT_KEY, platform client; INNGEST_DEV/ENGAGEMENT_DRY_RUN default in ./dry-run-engagement-env.ts

import "./dry-run-engagement-env";
import { getPlatformClientId } from "@/lib/auth/platform-client";
import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";

const STOP_STAGES = new Set(["BUILDING_COMPLETE", "FAILED"]);

/**
 * Public URL the browser uses (Clerk, dashboard). Prefer NEXT_PUBLIC_APP_URL, else `PORT` (same as `next dev -p`), else 3000.
 */
function getBaseAppUrl(): string {
  const fromPublic = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromPublic) return fromPublic;
  const port = process.env.PORT?.trim() ?? "3000";
  return `http://localhost:${port}`;
}

async function runHarness(): Promise<void> {
  if (!process.env.INNGEST_EVENT_KEY) {
    console.error("[dry-run-engagement] INNGEST_EVENT_KEY is required to send Inngest events.");
    process.exit(1);
  }
  if (!process.env.STITCH_API_KEY?.trim()) {
    console.error(
      "[dry-run-engagement] STITCH_API_KEY is required. The Inngest stitch-designer function runs on your Next app and uses @google/stitch-sdk (set in .env for `bun run dev:next-only`).",
    );
    process.exit(1);
  }
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()) {
    console.error(
      "[dry-run-engagement] GOOGLE_GENERATIVE_AI_API_KEY is required for the profiler and PRD writer (Gemini).",
    );
    process.exit(1);
  }

  const clientId = await getPlatformClientId();
  if (!clientId) {
    console.error(
      "[dry-run-engagement] No platform client: set PLATFORM_CLIENT_ID or PLATFORM_CLERK_ORG_ID, or create a client with isPlatformOwner=true.",
    );
    process.exit(1);
  }

  const ts = Date.now();
  const lead = await prisma.lead.create({
    data: {
      clientId,
      source: "OUTBOUND_PROSPECT",
      status: "SCRAPED",
      customerName: `Dry Run Contact ${ts}`,
      email: `dry-run+${ts}@example.com`,
      scrapedData: {
        dryRun: true,
        companyName: `dry-run-${ts}`,
        websiteUrl: "https://example.com",
        aiPresence: false,
        auditSummary: "Synthetic lead for pipeline dry run (scripts/dry-run-engagement).",
        painPoints: ["Manual workflows", "No self-serve customer portal", "Data scattered across tools"],
        draftBody: "We need a focused internal dashboard to manage leads and see pipeline health at a glance.",
        targetOutreachAngle: "Prototype fast, iterate on UX",
      },
    },
  });

  await inngest.send({
    name: "engagement/lead.approved",
    data: { leadId: lead.id, clientId },
  });

  const base = getBaseAppUrl();
  const inngestServeUrl = `${base}/api/kona/inngest`;
  const dashboardUrl = `${base}/dashboard/automation/queue/${lead.id}`;

  console.log(`[dry-run-engagement] Created lead ${lead.id}`);
  console.log(`[dry-run-engagement] Sent engagement/lead.approved`);
  console.log(`[dry-run-engagement] Open dashboard: ${dashboardUrl}`);
  console.log(
    "[dry-run-engagement] Prereq: Next + Inngest dev, STITCH_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY. Inngest `-u` must be the **serve** URL (this repo: /api/kona/inngest) —",
  );
  console.log(`    • Terminal A:  PORT=${process.env.PORT ?? "3000"} bun run dev:next-only   → ${base}`);
  console.log(`    • Terminal B:  bun run inngest:dev   (or: bunx inngest dev -u ${inngestServeUrl})`);
  console.log("[dry-run-engagement] Polling Prisma for ProductSpec every 5s (first stage may take a minute)…\n");

  let lastStage: string | null = null;
  const start = Date.now();
  const maxMs = 45 * 60_000;
  let pollsWithNoSpec = 0;
  let warnedStalled = false;

  for (;;) {
    if (Date.now() - start > maxMs) {
      console.error("[dry-run-engagement] Timed out waiting for BUILDING_COMPLETE or FAILED.");
      process.exit(1);
    }

    const spec = await prisma.productSpec.findUnique({
      where: { leadId: lead.id },
      select: { stage: true },
    });

    const stage = spec?.stage;
    if (!spec) {
      pollsWithNoSpec += 1;
      if (pollsWithNoSpec >= 6 && !warnedStalled) {
        warnedStalled = true;
        console.warn(
          `[dry-run-engagement] Still no ProductSpec after ~30s — use \`bun run inngest:dev\` (syncs ${getBaseAppUrl()}/api/kona/inngest), not the app root only. Check Inngest UI at http://127.0.0.1:8288`,
        );
      }
    } else {
      pollsWithNoSpec = 0;
    }

    if (stage && stage !== lastStage) {
      console.log(`[dry-run-engagement] stage → ${stage}`);
      lastStage = stage;
    }

    if (stage && STOP_STAGES.has(stage)) {
      console.log(
        `[dry-run-engagement] Finished (${stage}). Cleanup: bun scripts/dry-run-engagement.ts --cleanup ${lead.id}`,
      );
      return;
    }

    await new Promise((r) => setTimeout(r, 5000));
  }
}

async function runCleanup(leadId: string | undefined): Promise<void> {
  const id = leadId ?? process.env.DRY_RUN_ENGAGEMENT_LEAD_ID;
  if (!id) {
    console.error("Usage: bun scripts/dry-run-engagement.ts --cleanup <leadId>");
    process.exit(1);
  }

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    console.error(`[dry-run-engagement] No lead with id ${id}.`);
    process.exit(1);
  }
  const scraped = lead.scrapedData;
  if (
    typeof scraped !== "object" ||
    scraped === null ||
    !("dryRun" in scraped) ||
    (scraped as { dryRun?: boolean }).dryRun !== true
  ) {
    console.error(
      "[dry-run-engagement] Refusing to delete: scrapedData.dryRun is not true (not created by this harness).",
    );
    process.exit(1);
  }

  await prisma.lead.delete({ where: { id: lead.id } });
  console.log(`[dry-run-engagement] Deleted lead ${lead.id} and related ProductSpec (if any).`);
}

const argv = process.argv.slice(2);
if (argv[0] === "--cleanup") {
  void runCleanup(argv[1])
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
} else {
  void runHarness()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
