"use client";

/**
 * DEV PREVIEW — engagement pipeline UI states
 * Route: /dashboard/automation/queue/preview
 *
 * Shows every EngagementPanel and AutomationStatusBadge state without
 * needing real data or a running pipeline.
 */

import Link from "next/link";
import { Typography } from "@/components/ui/typography";
import { EngagementPanel } from "../[id]/_components/engagement-panel";

const MOCK_STATUSES = [
  {
    label: "Loading",
    status: null,
  },
  {
    label: "Not Started",
    status: { stage: "NOT_STARTED" },
  },
  {
    label: "Pending (queued)",
    status: { stage: "PENDING" },
  },
  {
    label: "Profiling",
    status: {
      stage: "PROFILING",
      updatedAt: new Date().toISOString(),
    },
  },
  {
    label: "Writing PRD",
    status: {
      stage: "WRITING_PRD",
      updatedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    },
  },
  {
    label: "Designing",
    status: {
      stage: "DESIGNING",
      updatedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    },
  },
  {
    label: "Building (with artifacts)",
    status: {
      stage: "BUILDING",
      githubRepo: "graft-today/demo-build",
      githubIssueUrl: "https://github.com/graft-today/demo-build/issues/1",
      updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      profiledNeeds: {
        companyName: "Acme Ltd",
        websiteUrl: "https://example.com",
        industry: "Professional services",
        primaryNeed: "A client portal for booking and document sharing.",
        productType: "web-app",
        targetAudience: "SME operations leads",
        estimatedComplexity: "medium",
        painPoints: ["Email chains for scheduling", "No single view of status"],
        signals: ["High traffic on /contact", "Asked for login area in chat"],
      },
      prdContent:
        "## Problem\nTeams lose time chasing status in email.\n\n## MVP\n- Dashboard with **next actions**\n- Upload + list documents",
      designConcepts: [
        {
          index: 0,
          name: "Trust & clarity",
          description: "Neutral surface, strong hierarchy",
          previewUrl: "https://placehold.co/400x225/e2e8f0/1e293b?text=A",
        },
        {
          index: 1,
          name: "Bold conversion",
          description: "High contrast CTA",
          previewUrl: "https://placehold.co/400x225/1e293b/f8fafc?text=B",
        },
        {
          index: 2,
          name: "Warm support",
          description: "Soft tones, approachable",
          previewUrl: "https://placehold.co/400x225/fef3c7/78350f?text=C",
        },
      ],
      chosenDesign: 0,
    },
  },
  {
    label: "Deployed (complete)",
    status: {
      stage: "DEPLOYED",
      githubRepo: "https://github.com/graft-today/demo-build",
      githubIssueUrl: "https://github.com/graft-today/demo-build/issues/1",
      deploymentUrl: "https://demo.vercel.app",
      updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  },
  {
    label: "Offer Sent (complete)",
    status: {
      stage: "OFFER_SENT",
      offerSentAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      githubRepo: "https://github.com/graft-today/demo-build",
      githubIssueUrl: "https://github.com/graft-today/demo-build/issues/1",
      deploymentUrl: "https://demo.vercel.app",
    },
  },
  {
    label: "Failed (with error)",
    status: {
      stage: "FAILED",
      errorMessage:
        "Inngest function timed out during BUILDING stage. The GitHub API returned a 503 after 3 retries. Check the Inngest dashboard for full run details.",
      githubRepo: "https://github.com/graft-today/demo-build",
    },
  },
] as const;

export default function EngagementPipelinePreview() {
  return (
    <div className="container max-w-4xl py-10 space-y-10">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography.H1>Engagement Pipeline — UI States</Typography.H1>
          <Typography.Muted className="mt-1">Dev preview · all states rendered without real data</Typography.Muted>
        </div>
        <Link
          href="/dashboard/automation/queue"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          ← Back to Queue
        </Link>
      </div>

      {/* states */}
      <div className="space-y-8">
        {MOCK_STATUSES.map(({ label, status }) => (
          <div key={label} className="space-y-2">
            <p className="text-xs font-data uppercase tracking-widest text-muted-foreground">{label}</p>
            <EngagementPanel
              // biome-ignore lint: preview mock accepts readonly status shapes
              status={status as Parameters<typeof EngagementPanel>[0]["status"]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
