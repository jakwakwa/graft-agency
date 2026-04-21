"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { Button } from "@/components/ui-v2/button";
import { isTerminalStage } from "@/lib/utils/engagement-stages";

interface ScrapedData {
  websiteUrl?: string;
  draftSubject?: string;
  draftBody?: string;
  businessDescription?: string;
  hasChatbot?: boolean;
  hasVoiceAgent?: boolean;
  painPoints?: string[];
  targetOutreachAngle?: string;
  coreServices?: Array<{ name: string; description: string }>;
}

interface Lead {
  id: string;
  customerName: string | null;
  scrapedData: ScrapedData | null;
  createdAt: string;
}

interface EngagementStatus {
  stage: string;
  githubRepo?: string | null;
  githubIssueUrl?: string | null;
  deploymentUrl?: string | null;
  offerSentAt?: string | null;
  errorMessage?: string | null;
  updatedAt?: string | null;
}

export default function QueueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [engagementStatus, setEngagementStatus] = useState<EngagementStatus | null>(null);
  const [engagementLoading, setEngagementLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [leadRes, statusRes] = await Promise.all([
          fetch(`/api/leads/${id}`),
          fetch(`/api/engagement/status/${id}`),
        ]);

        if (!leadRes.ok) {
          setMessage({ type: "error", text: "Prospect not found." });
          return;
        }

        const data: Lead = await leadRes.json();
        setLead(data);

        if (statusRes.ok) {
          const statusData: EngagementStatus = await statusRes.json();
          setEngagementStatus(statusData);
        }
      } catch {
        setMessage({ type: "error", text: "Failed to load prospect." });
      } finally {
        setLoading(false);
        setEngagementLoading(false);
      }
    }
    fetchAll();
  }, [id]);

  useEffect(() => {
    if (engagementLoading) return;
    if (engagementStatus && isTerminalStage(engagementStatus.stage)) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/engagement/status/${id}`);
        if (res.ok) {
          const data: EngagementStatus = await res.json();
          setEngagementStatus(data);
          if (isTerminalStage(data.stage)) clearInterval(interval);
        }
      } catch {
        // silently ignore polling errors
      }
    }, 15000); // poll every 15 seconds

    return () => clearInterval(interval);
  }, [id, engagementStatus, engagementLoading]);

  async function handleApprove() {
    if (!lead) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/leads/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Approve failed");
      setMessage({ type: "success", text: "Lead approved and email sent." });
      setTimeout(() => router.push("/dashboard/automation/queue"), 1500);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to approve.",
      });
    } finally {
      setApproving(false);
    }
  }

  async function handleDiscard() {
    if (!lead) return;
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      });
      if (!res.ok) throw new Error("Discard failed");
      router.push("/dashboard/automation/queue");
    } catch {
      setMessage({ type: "error", text: "Failed to discard." });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="h-20 animate-pulse rounded-2xl bg-muted" />
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 h-[560px] animate-pulse rounded-2xl bg-card lg:col-span-7" />
            <div className="col-span-12 h-[560px] animate-pulse rounded-2xl bg-muted lg:col-span-5" />
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-background p-8 text-foreground">
        <Link href="/dashboard/automation/queue" className="text-sm text-muted-foreground hover:text-foreground">
          ← Prospect Queue
        </Link>
        <p className="mt-4 text-muted-foreground">Prospect not found.</p>
      </div>
    );
  }

  const stage = engagementStatus?.stage ?? "BUILD_START";
  const isFailure = Boolean(engagementStatus?.errorMessage) || /(FAILED|ERROR|TERMINATED)/i.test(stage);
  const isSuccess = /(OFFER|LIVE|SUCCESS|COMPLETED|APPROVED)/i.test(stage) && !isFailure;
  const statusTone = isFailure ? "text-destructive" : isSuccess ? "text-chart-2" : "text-chart-3";
  const statusLabel = isFailure ? "Critical Alert" : isSuccess ? "Active Success" : "Pipeline Active";
  const d = lead.scrapedData ?? {};
  return (
    <MarketingShell>
      <div className="mx-auto max-w-7xl p-12 space-y-8">
        <div className="mx-auto max-w-7xl p-12">
          <header className="mb-16">
            <h1 className="mb-4 font-headline text-6xl font-black tracking-tighter text-foreground">
              System Health & Prospect Status
            </h1>
            <p className="max-w-2xl font-sans text-xl font-light text-muted-foreground">
              Real-time monitoring of automated build pipelines and strategic agent engagement states.
            </p>
          </header>

          {message && (
            <div
              className={`mb-8 rounded-xl p-4 text-sm ${message.type === "success" ? "bg-chart-2/15 text-chart-2" : "bg-destructive/15 text-destructive"}`}
            >
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-12 gap-8">
            <section className="relative col-span-12 overflow-hidden rounded-2xl bg-card p-8 shadow-ambient lg:col-span-7">
              <div className="absolute right-0 top-0 p-4">
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest ${
                    isFailure
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-chart-3/30 bg-chart-3/10 text-chart-3"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>

              <div className="mb-12 flex items-start gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <div className="h-12 w-12 rounded-lg bg-muted-foreground/30" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-bold text-foreground">
                    {lead.customerName ?? "Unknown Prospect"}
                  </h2>
                  <p className="text-muted-foreground">
                    Stage: <span className={`${statusTone}`}>{stage.replaceAll("_", " ")}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-2">
                  <span className="text-xs uppercase text-muted-foreground">Pipeline Workflow</span>
                  <span className={`text-xs ${isFailure ? "text-destructive" : "text-chart-2"}`}>
                    Status: {isFailure ? "Terminated" : isSuccess ? "Completed" : "Running"}
                  </span>
                </div>

                <div className="relative flex items-center justify-between px-8">
                  <div className="absolute left-1/2 top-1/2 h-[2px] w-[80%] -translate-x-1/2 -translate-y-1/2 bg-muted" />
                  <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-chart-3 text-primary-foreground">
                    ✓
                  </div>
                  <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-chart-3 text-primary-foreground">
                    ✓
                  </div>
                  <div
                    className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-card text-primary-foreground ${
                      isFailure ? "animate-pulse bg-destructive" : "bg-chart-3"
                    }`}
                  >
                    {isFailure ? "✕" : "✓"}
                  </div>
                  <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    …
                  </div>
                </div>

                <div
                  className={`mt-8 rounded-2xl border-l-4 p-6 ${isFailure ? "border-destructive bg-destructive/10" : "border-chart-2 bg-chart-2/10"}`}
                >
                  <div className={`mb-2 flex items-center gap-3 ${isFailure ? "text-destructive" : "text-chart-2"}`}>
                    <h4 className="font-bold">{isFailure ? "Build Failed" : "Build Healthy"}</h4>
                  </div>
                  <p className="text-sm leading-relaxed text-card-foreground">
                    {engagementStatus?.errorMessage
                      ? engagementStatus.errorMessage
                      : isFailure
                        ? "Repository synchronization timed out after 300 seconds. Connection to deployment node was lost during initialization."
                        : "Automated proposal and deployment assets are progressing through the build pipeline without detected issues."}
                  </p>
                  <div className="mt-6 flex gap-4">
                    <Button
                      onClick={isFailure ? () => router.refresh() : handleApprove}
                      className={`rounded-lg px-6 py-2 text-xs font-bold uppercase tracking-tighter text-primary-foreground transition-colors ${
                        isFailure ? "bg-destructive hover:bg-destructive/90" : "bg-chart-2 hover:bg-chart-2/90"
                      }`}
                    >
                      {isFailure ? "Retry Build" : approving ? "Approving…" : "Approve & Send"}
                    </Button>
                    <Button
                      onClick={() => router.push(`/dashboard/automation/queue/${id}`)}
                      className="rounded-lg bg-muted px-6 py-2 text-xs font-bold uppercase tracking-tighter text-foreground transition-colors hover:bg-muted/80"
                    >
                      Debug Logs
                    </Button>
                    <Button
                      onClick={handleDiscard}
                      className="rounded-lg bg-muted px-6 py-2 text-xs font-bold uppercase tracking-tighter text-muted-foreground hover:bg-muted/80"
                    >
                      Discard
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            <section className="col-span-12 flex flex-col rounded-2xl border-t border-outline-ghost bg-muted/40 p-8 shadow-xl lg:col-span-5">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-chart-2">
                  ✓
                </div>
                <span className="rounded-full bg-chart-5/15 px-3 py-1 text-[10px] uppercase tracking-widest text-chart-5">
                  {isSuccess ? "Active Success" : "In Progress"}
                </span>
              </div>

              <div className="mb-10">
                <h2 className="mb-2 font-display text-3xl font-bold text-foreground">
                  {lead.customerName ?? "Prospect Workspace"}
                </h2>
                <p className="font-light text-muted-foreground">
                  Stage:{" "}
                  <span className="text-chart-5">
                    {isSuccess ? "Commercial Offer Issued" : stage.replaceAll("_", " ")}
                  </span>
                </p>
              </div>

              <div className="flex-1 space-y-4">
                <p className="mb-8 border-l-2 border-chart-5/40 pl-4 text-sm italic text-foreground/90">
                  "The automated proposal has been generated and validated against client design directions. All
                  technical assets are live."
                </p>

                <div className="grid grid-cols-1 gap-3">
                  <a
                    href={engagementStatus?.githubRepo ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between rounded-xl bg-muted p-4 transition-all hover:bg-chart-5/10"
                  >
                    <span className="text-sm text-foreground">View Repository</span>
                    <span className="text-muted-foreground transition-colors group-hover:text-chart-5">→</span>
                  </a>
                  <a
                    href={engagementStatus?.deploymentUrl ?? d.websiteUrl ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between rounded-xl bg-muted p-4 transition-all hover:bg-chart-5/10"
                  >
                    <span className="text-sm text-foreground">Live Preview</span>
                    <span className="text-muted-foreground transition-colors group-hover:text-chart-5">→</span>
                  </a>
                  <Button
                    onClick={() => router.push("/dashboard/automation")}
                    className="group flex items-center justify-between rounded-xl bg-muted p-4 text-left transition-all hover:bg-chart-5/10"
                  >
                    <span className="text-sm text-foreground">Open Product Brief</span>
                    <span className="text-muted-foreground transition-colors group-hover:text-chart-5">→</span>
                  </Button>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-outline-ghost pt-6">
                <div className="flex -space-x-2">
                  <div className="h-8 w-8 rounded-full border-2 border-background bg-muted" />
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-bold text-muted-foreground">
                    +2
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">3 Agents Assigned</span>
              </div>
            </section>

            <div className="col-span-12 rounded-2xl bg-card p-6 lg:col-span-4">
              <div className="flex items-center gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-chart-5/20 border-t-chart-5">
                  <span className="text-lg font-bold text-chart-5">88%</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Network Efficiency</h4>
                  <p className="text-xs text-muted-foreground">Global build nodes stable</p>
                </div>
              </div>
            </div>

            <div className="col-span-12 rounded-2xl bg-card p-6 lg:col-span-4">
              <div className="flex items-center gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-chart-2">
                  ⚡
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">2.4s Deployment</h4>
                  <p className="text-xs text-muted-foreground">Average build frequency</p>
                </div>
              </div>
            </div>

            <div className="col-span-12 rounded-2xl bg-card p-6 lg:col-span-4">
              <div className="flex items-center gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-chart-3">◎</div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">9 Prospect Hits</h4>
                  <p className="text-xs text-muted-foreground">Past 24 hour activity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed right-[-10%] top-[-10%] -z-10 h-[50%] w-[50%] rounded-full bg-chart-3/10 blur-[120px]" />
      <div className="fixed bottom-[-10%] left-[-10%] -z-10 h-[40%] w-[40%] rounded-full bg-primary/10 blur-[100px]" />
    </MarketingShell>
  );
}
