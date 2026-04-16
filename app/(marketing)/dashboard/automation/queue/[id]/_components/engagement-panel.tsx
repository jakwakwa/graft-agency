"use client";

import type { LucideProps } from "lucide-react";
import { AlertCircle, Brain, Check, ExternalLink, FileText, Hammer, Handshake, Palette, Rocket } from "lucide-react";
import type React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import {
  formatStageLabel,
  getCompletionPercent,
  getStepStatus,
  isFailedStage,
  isInProgressStage,
  PIPELINE_STEPS,
} from "@/lib/utils/engagement-stages";

// ------------------------------------------------------------------ types ---

interface EngagementStatus {
  stage: string;
  githubRepo?: string | null;
  githubIssueUrl?: string | null;
  deploymentUrl?: string | null;
  offerSentAt?: string | null;
  errorMessage?: string | null;
  updatedAt?: string | null;
}

interface EngagementPanelProps {
  status: EngagementStatus | null; // null = loading
}

// ------------------------------------------------------- step icon mapping ---

type StepIconProps = { className?: string };
type StepIconFn = (props: StepIconProps) => React.ReactNode;

// Tuple — fixed 6 entries; avoids noUncheckedIndexedAccess widening to T|undefined
const STEP_ICONS: [StepIconFn, StepIconFn, StepIconFn, StepIconFn, StepIconFn, StepIconFn] = [
  (p) => <Brain {...p} />,
  (p) => <FileText {...p} />,
  (p) => <Palette {...p} />,
  (p) => <Hammer {...p} />,
  (p) => <Rocket {...p} />,
  (p) => <Handshake {...p} />,
];

// ---------------------------------------------------------------- helpers ---

/**
 * Resolves Badge variant for the stage badge in the card header.
 */
function stageBadgeVariant(isFailed: boolean, isRunning: boolean): "destructive" | "outline" | "secondary" {
  if (isFailed) return "destructive";
  if (isRunning) return "outline";
  return "secondary";
}

// ------------------------------------------------------- action buttons ---

interface ActionButtonProps {
  href: string | null | undefined;
  label: string;
  ariaLabel: string;
  disabledAriaLabel: string;
}

function ActionButton({ href, label, ariaLabel, disabledAriaLabel }: ActionButtonProps) {
  if (href) {
    return (
      <Button
        variant="outline"
        size="sm"
        render={<a href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} />}
        nativeButton={false}
      >
        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
        {label}
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="outline" size="sm" disabled aria-label={disabledAriaLabel}>
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            {label}
          </Button>
        }
      />
      <TooltipContent>Not available yet</TooltipContent>
    </Tooltip>
  );
}

// ------------------------------------------------------- main component ---

export function EngagementPanel({ status }: EngagementPanelProps) {
  const stage = status?.stage ?? "NOT_STARTED";
  const completionPct = getCompletionPercent(stage);
  const isFailed = isFailedStage(stage);
  const isRunning = isInProgressStage(stage);

  const isPipelineStarted = status !== null && stage !== "NOT_STARTED" && stage !== "PENDING";

  return (
    <TooltipProvider>
      <section aria-labelledby="engagement-heading">
        <Card className="rounded-lg border border-border overflow-hidden">
          {/* ---- header ---- */}
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <Typography.H4 id="engagement-heading" className="mb-0">
              Engagement Pipeline
            </Typography.H4>
            <div className="flex items-center gap-3">
              <Badge variant={stageBadgeVariant(isFailed, isRunning)}>{formatStageLabel(stage)}</Badge>
              {completionPct > 0 && !isFailed && (
                <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                  {completionPct}% complete
                </span>
              )}
            </div>
          </CardHeader>

          {/* ---- loading ---- */}
          {status === null && (
            <CardContent className="flex items-center justify-center py-12">
              <Spinner className="h-6 w-6 text-muted-foreground" />
            </CardContent>
          )}

          {/* ---- not started / pending ---- */}
          {status !== null && !isPipelineStarted && (
            <CardContent>
              <p className="text-sm text-muted-foreground">Automation has not run yet. Run the pipeline to begin.</p>
            </CardContent>
          )}

          {/* ---- pipeline stepper + actions (once started) ---- */}
          {isPipelineStarted && (
            <CardContent className="pt-0">
              {/* error alert */}
              {isFailed && status?.errorMessage && (
                <div className="pb-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{status.errorMessage}</AlertDescription>
                  </Alert>
                </div>
              )}

              {/* horizontal stepper */}
              <div className="relative">
                {/* background + filled progress line */}
                <div
                  className="absolute top-5 left-0 right-0 h-[2px] bg-border z-0"
                  style={{ marginInline: "calc(100% / 12)" }}
                >
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>

                {/* step circles + labels */}
                <div className="relative z-10 grid grid-cols-6 gap-2">
                  {PIPELINE_STEPS.map((step, index) => {
                    const stepStatus = getStepStatus(index, stage);
                    // STEP_ICONS is a fixed 6-element array; index is always 0-5
                    const StepIcon = STEP_ICONS[index as 0 | 1 | 2 | 3 | 4 | 5];

                    return (
                      <div key={step.label} className="flex flex-col items-center gap-2 text-center">
                        {/* done */}
                        {stepStatus === "done" && (
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                            <Check className="h-4 w-4" strokeWidth={3} />
                          </div>
                        )}

                        {/* current — running */}
                        {stepStatus === "current" && !isFailed && (
                          <div className="w-12 h-12 -mt-1 rounded-full border-2 border-primary bg-card flex items-center justify-center text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
                            <StepIcon className="h-5 w-5 motion-safe:animate-pulse" />
                          </div>
                        )}

                        {/* current — failed */}
                        {stepStatus === "current" && isFailed && (
                          <div className="w-12 h-12 -mt-1 rounded-full border-2 border-destructive bg-card flex items-center justify-center text-destructive">
                            <AlertCircle className="h-5 w-5" />
                          </div>
                        )}

                        {/* pending */}
                        {stepStatus === "pending" && (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground opacity-50">
                            <StepIcon className="h-4 w-4" />
                          </div>
                        )}

                        {/* step label block */}
                        <div className="space-y-0.5">
                          <p
                            className={`text-[9px] font-mono font-bold uppercase tracking-wider ${
                              stepStatus === "done"
                                ? "text-primary"
                                : stepStatus === "current"
                                  ? isFailed
                                    ? "text-destructive"
                                    : "text-primary"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {stepStatus === "done"
                              ? "Done"
                              : stepStatus === "current"
                                ? isFailed
                                  ? "Failed"
                                  : "Running"
                                : "Pending"}
                          </p>
                          <p
                            className={`text-xs font-medium leading-tight ${
                              stepStatus === "pending" ? "text-muted-foreground/60" : "text-foreground"
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* last updated — shown when running */}
              {isRunning && status?.updatedAt && (
                <p className="mt-4 text-xs text-muted-foreground" aria-live="polite">
                  Last updated{" "}
                  {new Date(status.updatedAt).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}

              {/* external action buttons */}
              <Separator className="my-4" />
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  href={status?.githubRepo}
                  label="Open Repo"
                  ariaLabel="Open GitHub repository (opens in new tab)"
                  disabledAriaLabel="Repository not yet available"
                />
                <ActionButton
                  href={status?.githubIssueUrl}
                  label="Open Issue"
                  ariaLabel="Open GitHub issue (opens in new tab)"
                  disabledAriaLabel="Issue not yet available"
                />
                <ActionButton
                  href={status?.deploymentUrl}
                  label="Open Preview"
                  ariaLabel="Open deployment preview (opens in new tab)"
                  disabledAriaLabel="Preview not yet available"
                />
              </div>
            </CardContent>
          )}
        </Card>
      </section>
    </TooltipProvider>
  );
}
