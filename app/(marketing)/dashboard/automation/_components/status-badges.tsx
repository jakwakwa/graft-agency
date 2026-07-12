import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { getStageCategory } from "@/lib/utils/engagement-stages";
import { LEAD_PIPELINE_STATUS_LABELS, type LeadPipelineStatus } from "@/lib/utils/lead-pipeline-status";

/**
 * Shared status pills for the automation dashboard (queue + leads pages).
 * One base variant set; the exported badges only map domain values to tones.
 */
const statusPillVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-data text-[10px] font-bold uppercase tracking-widest",
  {
    variants: {
      tone: {
        muted: "bg-muted/50 text-muted-foreground border-outline-ghost/20",
        primary: "bg-primary/10 text-primary border-primary/20",
        secondary: "bg-secondary/10 text-secondary border-secondary/20",
        accent: "bg-accent/10 text-accent border-accent/20",
        success: "bg-green-500/10 text-green-400 border-green-500/20",
        warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        destructive: "bg-destructive/10 text-destructive border-destructive/20",
      },
    },
    defaultVariants: {
      tone: "muted",
    },
  },
);

type StatusPillTone = NonNullable<VariantProps<typeof statusPillVariants>["tone"]>;

interface StatusPillProps extends React.ComponentProps<"span">, VariantProps<typeof statusPillVariants> {
  /** Render the leading status dot; `pulse` animates it for live states. */
  withDot?: boolean;
  pulse?: boolean;
}

export function StatusPill({ className, tone, withDot = false, pulse = false, children, ...props }: StatusPillProps) {
  return (
    <span className={cn(statusPillVariants({ tone }), className)} {...props}>
      {withDot && <span className={cn("h-1.5 w-1.5 rounded-full bg-current", pulse && "animate-pulse")} />}
      {children}
    </span>
  );
}

const LEAD_STATUS_TONES: Record<string, StatusPillTone> = {
  DRAFT_PENDING: "primary",
  CONTACTED: "secondary",
  REPLIED: "accent",
  BOOKED: "success",
  CLOSED: "muted",
  SCRAPED: "muted",
};

const LEAD_STATUS_LABELS: Record<string, string> = {
  DRAFT_PENDING: "Draft",
  CONTACTED: "Contacted",
  REPLIED: "Replied",
  BOOKED: "Booked",
  CLOSED: "Closed",
  SCRAPED: "Scraped",
};

export function LeadStatusBadge({ status }: { status: string }) {
  return <StatusPill tone={LEAD_STATUS_TONES[status] ?? "muted"}>{LEAD_STATUS_LABELS[status] ?? status}</StatusPill>;
}

const STAGE_CATEGORY_PILLS: Record<
  ReturnType<typeof getStageCategory>,
  { tone: StatusPillTone; label: string; pulse: boolean }
> = {
  not_started: { tone: "muted", label: "Not Started", pulse: false },
  in_progress: { tone: "primary", label: "In Progress", pulse: true },
  complete: { tone: "success", label: "Complete", pulse: false },
  failed: { tone: "destructive", label: "Failed", pulse: false },
};

export function EngagementStageBadge({ stage }: { stage: string }) {
  const { tone, label, pulse } = STAGE_CATEGORY_PILLS[getStageCategory(stage)];
  return (
    <StatusPill tone={tone} withDot pulse={pulse}>
      {label}
    </StatusPill>
  );
}

const PIPELINE_STATUS_TONES: Record<LeadPipelineStatus, { tone: StatusPillTone; pulse: boolean }> = {
  approved: { tone: "success", pulse: false },
  denied: { tone: "muted", pulse: false },
  failed: { tone: "destructive", pulse: false },
  draft: { tone: "warning", pulse: true },
};

export function PipelineStatusBadge({ status }: { status: LeadPipelineStatus }) {
  const { tone, pulse } = PIPELINE_STATUS_TONES[status];
  return (
    <StatusPill tone={tone} withDot pulse={pulse}>
      {LEAD_PIPELINE_STATUS_LABELS[status]}
    </StatusPill>
  );
}
