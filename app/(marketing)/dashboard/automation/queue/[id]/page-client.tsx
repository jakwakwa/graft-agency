"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { Button } from "@/components/ui-v2/button";
import { isTerminalStage } from "@/lib/utils/engagement-stages";
import { EngagementPanel } from "./_components/engagement-panel";

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
  status: string;
  scrapedData: ScrapedData | null;
  createdAt: string;
}

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
  renderServiceId?: string | null;
  renderServiceName?: string | null;
  pullRequestUrl?: string | null;
  deploymentUrl?: string | null;
  offerSentAt?: string | null;
  errorMessage?: string | null;
  updatedAt?: string | null;
  // durability fields
  inngestRunStatus?: string | null;
  lastReconciledAt?: string | null;
  isStale?: boolean;
  failure?: { stage: string; at: string; reason: string | null; source: string | null } | null;
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
  const [statusUnavailable, setStatusUnavailable] = useState(false);

  useEffect(() => {
    if (!id) return;

    const leadAbort = new AbortController();
    const statusAbort = new AbortController();
    const leadTimeout = setTimeout(() => leadAbort.abort(), 12000);
    const statusTimeout = setTimeout(() => statusAbort.abort(), 12000);

    async function fetchAll() {
      try {
        const [leadResult, statusResult] = await Promise.allSettled([
          fetch(`/api/leads/${id}`, { signal: leadAbort.signal }),
          fetch(`/api/engagement/status/${id}`, { signal: statusAbort.signal }),
        ]);

        if (leadResult.status === "rejected") {
          // Fallback for environments where the id endpoint stalls: resolve from list endpoint.
          try {
            const fallbackRes = await fetch("/api/leads");
            if (fallbackRes.ok) {
              const fallbackData = (await fallbackRes.json()) as Lead[];
              const matched = fallbackData.find((l) => l.id === id);
              if (matched) {
                setLead(matched);
              } else {
                setMessage({ type: "error", text: "Prospect not found." });
                return;
              }
            } else {
              setMessage({ type: "error", text: "Lead request timed out. Please retry." });
              return;
            }
          } catch {
            setMessage({ type: "error", text: "Lead request timed out. Please retry." });
            return;
          }
        } else {
          const leadRes = leadResult.value;
          if (!leadRes.ok) {
            setMessage({ type: "error", text: "Prospect not found." });
            return;
          }

          const data: Lead = await leadRes.json();
          setLead(data);
        }

        if (statusResult.status === "fulfilled" && statusResult.value.ok) {
          const statusData: EngagementStatus = await statusResult.value.json();
          setEngagementStatus(statusData);
          setStatusUnavailable(false);
        } else {
          // Leave engagementStatus null so the panel shows a real loading/error state
          // rather than lying "Not Started" while a pipeline may actually be running.
          setStatusUnavailable(true);
        }
      } catch {
        setMessage({ type: "error", text: "Failed to load prospect." });
      } finally {
        clearTimeout(leadTimeout);
        clearTimeout(statusTimeout);
        setLoading(false);
        setEngagementLoading(false);
      }
    }
    fetchAll();

    return () => {
      clearTimeout(leadTimeout);
      clearTimeout(statusTimeout);
      leadAbort.abort();
      statusAbort.abort();
    };
  }, [id]);

  useEffect(() => {
    if (engagementLoading) return;
    if (!statusUnavailable && engagementStatus && isTerminalStage(engagementStatus.stage)) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/engagement/status/${id}`);
        if (res.ok) {
          const data: EngagementStatus = await res.json();
          setEngagementStatus(data);
          setStatusUnavailable(false);
          if (isTerminalStage(data.stage)) clearInterval(interval);
        } else {
          setStatusUnavailable(true);
        }
      } catch {
        setStatusUnavailable(true);
      }
    }, 10000); // poll every 10 seconds

    return () => clearInterval(interval);
  }, [id, engagementStatus, engagementLoading, statusUnavailable]);

  async function handleApprove() {
    if (!lead) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/leads/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Approve failed");

      if (data.pipelineStarted) {
        setMessage({ type: "success", text: "Pipeline started — profiling prospect now." });
        // Refetch status immediately so the panel transitions from PENDING → PROFILING.
        const statusRes = await fetch(`/api/engagement/status/${id}`);
        if (statusRes.ok) {
          setEngagementStatus(await statusRes.json());
          setStatusUnavailable(false);
        }
      } else {
        const currentStage = data.stage ?? engagementStatus?.stage ?? "unknown";
        setMessage({ type: "success", text: `Pipeline already running — stage: ${currentStage}.` });
      }
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

  const stage = engagementStatus?.stage ?? "PENDING";

  // The lead's own status is the primary gate — if it's not DRAFT_PENDING or CONTACTED there's
  // nothing to approve regardless of pipeline state.
  const leadIsApprovable = lead.status === "DRAFT_PENDING" || lead.status === "CONTACTED";

  // The pipeline gate: only block if we have a confirmed running/complete stage from the server.
  // While status is still loading (engagementStatus === null) or temporarily unavailable,
  // show the button — the approve endpoint is idempotent and handles the "already running" case.
  const pipelineIsKnownRunning =
    engagementStatus !== null &&
    !statusUnavailable &&
    stage !== "PENDING" &&
    stage !== "NOT_STARTED";

  const canApprove = leadIsApprovable && !pipelineIsKnownRunning;

  return (
    <MarketingShell>
      <div className="mx-auto max-w-5xl p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/automation/queue" className="text-sm text-muted-foreground hover:text-foreground">
            ← Prospect Queue
          </Link>
          <div className="flex gap-2">
            {canApprove && (
              <Button
                onClick={handleApprove}
                disabled={approving}
                className="rounded-lg bg-chart-2 px-4 py-2 text-xs font-bold uppercase tracking-tighter text-primary-foreground hover:bg-chart-2/90"
              >
                {approving ? "Approving…" : "Approve & Send"}
              </Button>
            )}
            <Button
              onClick={handleDiscard}
              className="rounded-lg bg-muted px-4 py-2 text-xs font-bold uppercase tracking-tighter text-muted-foreground hover:bg-muted/80"
            >
              Discard
            </Button>
          </div>
        </div>

        <header>
          <h1 className="font-display text-3xl font-bold text-foreground">{lead.customerName ?? "Unknown Prospect"}</h1>
          <p className="text-sm text-muted-foreground">
            Lead <span className="font-mono">{lead.id}</span>
          </p>
        </header>

        {message && (
          <div
            className={`rounded-xl p-4 text-sm ${message.type === "success" ? "bg-chart-2/15 text-chart-2" : "bg-destructive/15 text-destructive"}`}
          >
            {message.text}
          </div>
        )}

        <EngagementPanel status={engagementStatus} statusUnavailable={statusUnavailable} />
      </div>
    </MarketingShell>
  );
}
