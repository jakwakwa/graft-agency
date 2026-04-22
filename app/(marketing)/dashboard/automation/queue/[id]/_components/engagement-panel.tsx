"use client";

import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import {
  AlertCircle,
  Brain,
  Check,
  ChevronDown,
  ExternalLink,
  FileText,
  Hammer,
  Handshake,
  Palette,
  Rocket,
} from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useState } from "react";
import { Streamdown } from "streamdown";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
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
  profiledNeeds?: unknown;
  prdContent?: string | null;
  designConcepts?: unknown;
  chosenDesign?: number | null;
  githubRepo?: string | null;
  githubIssueUrl?: string | null;
  julesSessionId?: string | null;
  julesState?: string | null;
  julesLastPolledAt?: string | null;
  pullRequestUrl?: string | null;
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

const STEP_ICONS: [StepIconFn, StepIconFn, StepIconFn, StepIconFn, StepIconFn, StepIconFn] = [
  (p) => <Brain {...p} />,
  (p) => <FileText {...p} />,
  (p) => <Palette {...p} />,
  (p) => <Hammer {...p} />,
  (p) => <Rocket {...p} />,
  (p) => <Handshake {...p} />,
];

const streamdownPlugins = { cjk, code, math, mermaid };

const PROFILE_LABELS: Record<string, string> = {
  companyName: "Company",
  websiteUrl: "Website",
  industry: "Industry",
  primaryNeed: "Primary need",
  productType: "Product type",
  targetAudience: "Target audience (ICP fit)",
  estimatedComplexity: "Complexity",
  leadId: "Lead",
};

// ---------------------------------------------------------------- helpers ---

function stageBadgeVariant(isFailed: boolean, isRunning: boolean): "destructive" | "outline" | "secondary" {
  if (isFailed) return "destructive";
  if (isRunning) return "outline";
  return "secondary";
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function parseDesignConcepts(raw: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(raw)) return [];
  return raw.map((c) => asRecord(c) ?? {}).filter((c) => Object.keys(c).length > 0);
}

function conceptName(c: Record<string, unknown>): string {
  return typeof c.name === "string" && c.name.length > 0 ? c.name : "Concept";
}

function conceptLink(c: Record<string, unknown>): string | undefined {
  for (const k of ["htmlUrl", "screenshotUrl", "previewUrl", "imageUrl", "url", "link", "stitchUrl", "figmaUrl"]) {
    const v = c[k];
    if (typeof v === "string" && (v.startsWith("http://") || v.startsWith("https://"))) {
      return v;
    }
  }
  return undefined;
}

function conceptImage(c: Record<string, unknown>): string | undefined {
  const img = c.screenshotUrl ?? c.previewImageUrl ?? c.imageUrl ?? c.image ?? c.thumbnailUrl;
  return typeof img === "string" && (img.startsWith("http://") || img.startsWith("https://")) ? img : undefined;
}

function githubBrowserUrl(repo: string | null | undefined): string | undefined {
  if (!repo) return undefined;
  if (repo.startsWith("http://") || repo.startsWith("https://")) return repo;
  return `https://github.com/${repo}`;
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
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex items-center gap-0")}
        aria-label={ariaLabel}
      >
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        {label}
      </a>
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

// ------------------------------------------------------- profiled needs UI ---

function ProfiledNeedsBody({ data }: { data: unknown }) {
  const obj = asRecord(data);
  if (!obj) {
    return <p className="text-sm text-muted-foreground">No profiled needs yet.</p>;
  }

  const painPoints = obj.painPoints;
  const signals = obj.signals;
  const mainKeys = [
    "companyName",
    "websiteUrl",
    "industry",
    "primaryNeed",
    "productType",
    "targetAudience",
    "estimatedComplexity",
  ] as const;
  const mainKeySet = new Set<string>([...mainKeys, "painPoints", "signals", "leadId"]);
  const cards = mainKeys
    .map((k) => ({ key: k, value: obj[k] }))
    .filter((x) => x.value !== undefined && x.value !== null && x.value !== "");

  const otherKeys = (Object.keys(obj) as string[]).filter((k) => !mainKeySet.has(k));

  return (
    <div className="space-y-4">
      {cards.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {cards.map(({ key, value }) => (
            <div key={key} className="rounded-md border border-border/80 bg-muted/30 px-3 py-2 text-left">
              <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                {PROFILE_LABELS[key] ?? key}
              </p>
              <p className="text-sm text-foreground">{String(value)}</p>
            </div>
          ))}
        </div>
      )}

      {Array.isArray(painPoints) && painPoints.length > 0 && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground mb-1.5">Pain points</p>
          <ul className="list-disc pl-4 text-sm space-y-1">
            {painPoints.map((p) => (
              <li key={typeof p === "string" ? p : String(p)}>{typeof p === "string" ? p : String(p)}</li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(signals) && signals.length > 0 && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground mb-1.5">Signals</p>
          <ul className="list-disc pl-4 text-sm space-y-1">
            {signals.map((s) => (
              <li key={typeof s === "string" ? s : String(s)}>{typeof s === "string" ? s : String(s)}</li>
            ))}
          </ul>
        </div>
      )}

      {otherKeys.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {otherKeys.map((k) => {
            const v = obj[k];
            if (typeof v === "object" && v !== null) {
              return (
                <div key={k} className="sm:col-span-2 rounded-md border border-dashed p-2">
                  <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">{k}</p>
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{JSON.stringify(v, null, 2)}</pre>
                </div>
              );
            }
            return (
              <div key={k} className="rounded-md border border-border/80 bg-muted/30 px-3 py-2">
                <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">{k}</p>
                <p className="text-sm">{String(v)}</p>
              </div>
            );
          })}
        </div>
      )}

      {cards.length === 0 && !Array.isArray(painPoints) && !Array.isArray(signals) && otherKeys.length === 0 && (
        <p className="text-sm text-muted-foreground">No structured needs yet.</p>
      )}
    </div>
  );
}

// ------------------------------------------------------- main component ---

export function EngagementPanel({ status }: EngagementPanelProps) {
  const [openProfile, setOpenProfile] = useState(true);
  const [openPrd, setOpenPrd] = useState(true);
  const [openDesigns, setOpenDesigns] = useState(true);

  const stage = status?.stage ?? "NOT_STARTED";
  const completionPct = getCompletionPercent(stage);
  const isFailed = isFailedStage(stage);
  const isRunning = isInProgressStage(stage);

  const isPipelineStarted = status !== null && stage !== "NOT_STARTED" && stage !== "PENDING";

  const profiledNeeds = status?.profiledNeeds;
  const profiledRecord = asRecord(profiledNeeds);
  const companyName =
    profiledRecord && typeof profiledRecord.companyName === "string" ? profiledRecord.companyName : null;
  const prdContent = status?.prdContent?.trim() ?? "";
  const concepts = parseDesignConcepts(status?.designConcepts);
  const hasArtifacts = Boolean(profiledRecord || prdContent.length > 0 || concepts.length > 0);

  const isBuilding = stage === "BUILDING";
  const julesState = status?.julesState ?? null;
  const julesStateUpper = julesState?.toUpperCase();
  const julesIsRunning =
    julesStateUpper === "QUEUED" ||
    julesStateUpper === "IN_PROGRESS" ||
    julesStateUpper === "RUNNING" ||
    julesStateUpper === "PLANNING";
  const julesIsDone = julesStateUpper === "COMPLETED" || julesStateUpper === "SUCCEEDED";
  const julesIsFailed =
    julesStateUpper === "FAILED" ||
    julesStateUpper === "ERROR" ||
    julesStateUpper === "CANCELLED" ||
    julesStateUpper === "CANCELED";
  const showJulesCard = Boolean(status?.julesSessionId) && (isBuilding || stage === "BUILDING_COMPLETE" || isFailed);

  const julesLastPolledLabel = status?.julesLastPolledAt
    ? new Date(status.julesLastPolledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <TooltipProvider>
      <section aria-labelledby="engagement-heading">
        <Card className="rounded-lg border border-border overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex flex-col gap-0.5">
              <Typography.H4 id="engagement-heading" className="mb-0">
                Engagement Pipeline
              </Typography.H4>
              {companyName && (
                <p className="text-sm text-muted-foreground">{companyName}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={stageBadgeVariant(isFailed, isRunning)}>{formatStageLabel(stage)}</Badge>
              {completionPct > 0 && !isFailed && (
                <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                  {completionPct}% complete
                </span>
              )}
            </div>
          </CardHeader>

          {status === null && (
            <CardContent className="flex items-center justify-center py-12">
              <Spinner className="h-6 w-6 text-muted-foreground" />
            </CardContent>
          )}

          {status !== null && !isPipelineStarted && (
            <CardContent>
              <p className="text-sm text-muted-foreground">Automation has not run yet. Run the pipeline to begin.</p>
            </CardContent>
          )}

          {isPipelineStarted && (
            <CardContent className="pt-0">
              {isFailed && status?.errorMessage && (
                <div className="pb-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{status.errorMessage}</AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="relative">
                <div
                  className="absolute top-5 left-0 right-0 h-[2px] bg-border z-0"
                  style={{ marginInline: "calc(100% / 12)" }}
                >
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>

                <div className="relative z-10 grid grid-cols-6 gap-2">
                  {PIPELINE_STEPS.map((step, index) => {
                    const stepStatus = getStepStatus(index, stage);
                    const StepIcon = STEP_ICONS[index as 0 | 1 | 2 | 3 | 4 | 5];

                    return (
                      <div key={step.label} className="flex flex-col items-center gap-2 text-center">
                        {stepStatus === "done" && (
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                            <Check className="h-4 w-4" strokeWidth={3} />
                          </div>
                        )}

                        {stepStatus === "current" && !isFailed && (
                          <div className="w-12 h-12 -mt-1 rounded-full border-2 border-primary bg-card flex items-center justify-center text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
                            <StepIcon className="h-5 w-5 motion-safe:animate-pulse" />
                          </div>
                        )}

                        {stepStatus === "current" && isFailed && (
                          <div className="w-12 h-12 -mt-1 rounded-full border-2 border-destructive bg-card flex items-center justify-center text-destructive">
                            <AlertCircle className="h-5 w-5" />
                          </div>
                        )}

                        {stepStatus === "pending" && (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground opacity-50">
                            <StepIcon className="h-4 w-4" />
                          </div>
                        )}

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

              {hasArtifacts && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <Collapsible
                      className="rounded-md border border-border/80"
                      onOpenChange={setOpenProfile}
                      open={openProfile}
                    >
                      <CollapsibleTrigger
                        render={
                          <Button
                            className="flex w-full items-center justify-between p-3 text-left text-sm font-medium"
                            variant="ghost"
                          />
                        }
                      >
                        <span>Profiled needs</span>
                        <ChevronDown
                          className={cn("h-4 w-4 shrink-0 transition-transform", openProfile && "rotate-180")}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="border-t border-border/80 p-3 data-[state=open]:animate-in">
                        <ProfiledNeedsBody data={profiledNeeds} />
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible
                      className="rounded-md border border-border/80"
                      onOpenChange={setOpenPrd}
                      open={openPrd}
                    >
                      <CollapsibleTrigger
                        render={
                          <Button
                            className="flex w-full items-center justify-between p-3 text-left text-sm font-medium"
                            variant="ghost"
                          />
                        }
                      >
                        <span>PRD preview</span>
                        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", openPrd && "rotate-180")} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="border-t border-border/80 p-3 data-[state=open]:animate-in">
                        {prdContent.length > 0 ? (
                          <div className="max-h-96 overflow-y-auto pr-1">
                            <Streamdown
                              className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0"
                              plugins={streamdownPlugins}
                            >
                              {prdContent}
                            </Streamdown>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">PRD not written yet.</p>
                        )}
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible
                      className="rounded-md border border-border/80"
                      onOpenChange={setOpenDesigns}
                      open={openDesigns}
                    >
                      <CollapsibleTrigger
                        render={
                          <Button
                            className="flex w-full items-center justify-between p-3 text-left text-sm font-medium"
                            variant="ghost"
                          />
                        }
                      >
                        <div className="flex items-center gap-2">
                          <span>Design concepts</span>
                          {typeof status?.chosenDesign === "number" && concepts.length > 0 && (
                            <Badge variant="outline" className="text-[10px]">
                              Chosen: #{status.chosenDesign + 1}
                            </Badge>
                          )}
                        </div>
                        <ChevronDown
                          className={cn("h-4 w-4 shrink-0 transition-transform", openDesigns && "rotate-180")}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="border-t border-border/80 p-3 data-[state=open]:animate-in">
                        {concepts.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No design concepts yet.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {concepts.map((c, i) => {
                              const name = conceptName(c);
                              const link = conceptLink(c);
                              const image = conceptImage(c);
                              const isChosen = status?.chosenDesign === i;
                              return (
                                <div
                                  key={link ?? `${name}-${i}`}
                                  className={cn(
                                    "flex flex-col rounded-md border bg-muted/20 overflow-hidden",
                                    isChosen && "ring-1 ring-primary",
                                  )}
                                >
                                  {image && (
                                    <a
                                      href={link ?? image}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="relative block aspect-video overflow-hidden bg-muted/50"
                                    >
                                      <span className="sr-only">Open preview: {name}</span>
                                      <Image
                                        src={image}
                                        alt=""
                                        width={400}
                                        height={225}
                                        unoptimized
                                        className="h-full w-full object-cover"
                                      />
                                    </a>
                                  )}
                                  <div className="p-2 space-y-1">
                                    <p className="text-sm font-medium leading-tight">{name}</p>
                                    {link && (
                                      <a
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        Open link
                                      </a>
                                    )}
                                    {!link && !image && (
                                      <p className="text-xs text-muted-foreground">No preview URL in payload</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </>
              )}

              {isRunning && status?.updatedAt && (
                <p className="mt-4 text-xs text-muted-foreground" aria-live="polite">
                  Last updated{" "}
                  {new Date(status.updatedAt).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}

              {showJulesCard && (
                <>
                  <Separator className="my-4" />
                  <div className="rounded-md border border-border/80 bg-muted/20 p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Hammer className="h-4 w-4 text-muted-foreground" aria-hidden />
                        <span className="text-sm font-medium">Jules build</span>
                        {julesIsRunning && <Spinner className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <Badge
                        variant={julesIsFailed ? "destructive" : julesIsDone ? "secondary" : "outline"}
                        className="font-mono text-[10px] uppercase tracking-wider"
                      >
                        {julesState ?? "unknown"}
                      </Badge>
                    </div>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      {status?.julesSessionId && (
                        <div className="flex flex-col">
                          <dt className="font-mono uppercase tracking-wide text-muted-foreground text-[10px]">Session</dt>
                          <dd className="truncate font-mono">{status.julesSessionId}</dd>
                        </div>
                      )}
                      {julesLastPolledLabel && (
                        <div className="flex flex-col">
                          <dt className="font-mono uppercase tracking-wide text-muted-foreground text-[10px]">Last polled</dt>
                          <dd>{julesLastPolledLabel}</dd>
                        </div>
                      )}
                      {status?.pullRequestUrl && (
                        <div className="flex flex-col sm:col-span-2">
                          <dt className="font-mono uppercase tracking-wide text-muted-foreground text-[10px]">Pull request</dt>
                          <dd className="truncate">
                            <a
                              href={status.pullRequestUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {status.pullRequestUrl}
                            </a>
                          </dd>
                        </div>
                      )}
                      {status?.deploymentUrl && (
                        <div className="flex flex-col sm:col-span-2">
                          <dt className="font-mono uppercase tracking-wide text-muted-foreground text-[10px]">Render preview</dt>
                          <dd className="truncate">
                            <a
                              href={status.deploymentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {status.deploymentUrl}
                            </a>
                          </dd>
                        </div>
                      )}
                    </dl>
                    {julesIsRunning && !status?.pullRequestUrl && (
                      <p className="text-xs text-muted-foreground">
                        Jules builds run ~10 minutes. Poller checks every 60s and will surface the PR + Render preview URL once the session completes.
                      </p>
                    )}
                    {julesIsDone && !status?.pullRequestUrl && (
                      <p className="text-xs text-muted-foreground">
                        Jules session completed but no PR was detected in{" "}
                        <code className="font-mono">{status?.githubRepo ?? "the builds repo"}</code>. Check the session directly.
                      </p>
                    )}
                  </div>
                </>
              )}

              <Separator className="my-4" />
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  href={githubBrowserUrl(status?.githubRepo ?? null)}
                  label="Open Repo"
                  ariaLabel="Open GitHub repository (opens in new tab)"
                  disabledAriaLabel="Repository not yet available"
                />
                <ActionButton
                  href={status?.githubIssueUrl}
                  label="Open Jules Session"
                  ariaLabel="Open Jules session (opens in new tab)"
                  disabledAriaLabel="Jules session not yet available"
                />
                <ActionButton
                  href={status?.pullRequestUrl}
                  label="Open PR"
                  ariaLabel="Open pull request (opens in new tab)"
                  disabledAriaLabel="Pull request not yet available"
                />
                <ActionButton
                  href={status?.deploymentUrl}
                  label="Open Preview"
                  ariaLabel="Open Render preview deployment (opens in new tab)"
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
