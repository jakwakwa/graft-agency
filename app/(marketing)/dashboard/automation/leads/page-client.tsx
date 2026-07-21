"use client";

import { Check, ExternalLink, FileText, Loader2, Mail, Save, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { getStageCategory } from "@/lib/utils/engagement-stages";
import { getLeadPipelineStatus } from "@/lib/utils/lead-pipeline-status";
import { PipelineStatusBadge } from "../_components/status-badges";
import { DraftLinkSelector } from "./_components/draft-link-selector";
import { LeadCard } from "./_components/lead-card";
import { LeadStatusFilter, type LeadStatusFilterValue } from "./_components/lead-status-filter";
import { ListPagination } from "./_components/list-pagination";
import type { LeadItem } from "./_components/types";

const PAGE_SIZE = 5;

function pipelineStatusOf(lead: LeadItem) {
  return getLeadPipelineStatus({ leadStatus: lead.status, engagementStage: lead.engagement?.stage ?? null });
}

interface LeadsPageClientProps {
  initialLeads: LeadItem[];
}

export default function LeadsPageClient({ initialLeads }: LeadsPageClientProps) {
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);
  const [editingLead, setEditingLead] = useState<LeadItem | null>(initialLeads[0] ?? null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [approving, setApprove] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<LeadStatusFilterValue>("all");
  const [page, setPage] = useState(1);

  const filteredLeads = useMemo(
    () => (statusFilter === "all" ? leads : leads.filter((l) => pipelineStatusOf(l) === statusFilter)),
    [leads, statusFilter],
  );
  const pageCount = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleLeads = filteredLeads.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const draftCount = useMemo(() => leads.filter((l) => pipelineStatusOf(l) === "draft").length, [leads]);

  useEffect(() => {
    if (editingLead) {
      setSubject(editingLead.scrapedData?.draftSubject ?? "");
      setBody(editingLead.scrapedData?.draftBody ?? "");
    } else {
      setSubject("");
      setBody("");
    }
  }, [editingLead?.id, editingLead?.scrapedData?.draftSubject, editingLead?.scrapedData?.draftBody, editingLead]);

  function handleFilterChange(next: LeadStatusFilterValue) {
    setStatusFilter(next);
    setPage(1);
    const nextLeads = next === "all" ? leads : leads.filter((l) => pipelineStatusOf(l) === next);
    if (!nextLeads.some((l) => l.id === editingLead?.id)) {
      setEditingLead(nextLeads[0] ?? null);
    }
  }

  async function handleApprove(id: string) {
    setApprove(true);
    try {
      const res = await fetch(`/api/leads/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Approve failed");
      toast.success("Lead approved — engagement pipeline started.");

      // Keep the lead in the queue with its pipeline now running.
      const updatedLeads = leads.map((l) =>
        l.id === id
          ? {
              ...l,
              status: "CONTACTED",
              engagement: l.engagement ?? {
                stage: (data.stage as string) ?? "PENDING",
                failedStage: null,
                deploymentUrl: null,
                designConcepts: null,
                chosenDesign: null,
                offerSentAt: null,
              },
            }
          : l,
      );
      setLeads(updatedLeads);
      const updatedLead = updatedLeads.find((l) => l.id === id);
      if (updatedLead && editingLead?.id === id) setEditingLead(updatedLead);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve lead.");
    } finally {
      setApprove(false);
    }
  }

  async function handleSave(id: string) {
    setSaving(true);
    try {
      const lead = leads.find((l) => l.id === id);
      const merged = { ...(lead?.scrapedData ?? {}), draftSubject: subject, draftBody: body };
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scrapedData: merged }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Draft saved successfully.");

      const updatedLeads = leads.map((l) => {
        if (l.id === id) {
          return { ...l, scrapedData: merged };
        }
        return l;
      });
      setLeads(updatedLeads);

      // Update selected reference
      const updatedLead = updatedLeads.find((l) => l.id === id);
      if (updatedLead) setEditingLead(updatedLead);
    } catch {
      toast.error("Failed to save draft.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendEmail(id: string) {
    setSending(true);
    try {
      const res = await fetch(`/api/leads/${id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      toast.success("Outreach email sent successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email.");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to decline and delete this draft prospect?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Draft prospect deleted.");

      const updatedLeads = leads.filter((l) => l.id !== id);
      setLeads(updatedLeads);
      setEditingLead(updatedLeads[0] ?? null);
    } catch {
      toast.error("Failed to delete lead.");
    } finally {
      setDeleting(false);
    }
  }

  if (leads.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto p-8 flex flex-col items-center justify-center min-h-[60dvh] text-center space-y-6">
        <div className="p-1.5 rounded-[2.5rem]  bg-slate-400 sm:bg-transparent ring-1 ring-white/10 dark:ring-white/10 shadow-neon">
          <div className="w-16 h-16 rounded-[calc(2.5rem-0.375rem)] bg-card/50 flex items-center justify-center border border-white/5">
            <Check className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>
        <div className="space-y-2 max-w-md">
          <Typography.H3 className="text-xl font-bold text-foreground mt-0">Queue Fully Audited</Typography.H3>
          <Typography.P className="text-xs text-muted-foreground leading-relaxed">
            Excellent! There are no pending outreach drafts left to review. You are completely caught up.
          </Typography.P>
        </div>
        <Link href="/dashboard/automation/queue">
          <Button variant="outline" size="lg" className="rounded-full font-bold px-6 py-2.5">
            Manage Prospect Queue
          </Button>
        </Link>
      </div>
    );
  }

  const matchIndustries = editingLead?.scrapedData?.industries;
  const matchLocations = editingLead?.scrapedData?.locations;
  const formatMatchList = (value: unknown) => (Array.isArray(value) ? value.join(", ") : String(value));

  const editingPipelineStatus = editingLead ? pipelineStatusOf(editingLead) : null;
  const editingStageCategory = getStageCategory(editingLead?.engagement?.stage ?? "NOT_STARTED");
  const canApprove = editingPipelineStatus === "draft";
  const canSendEmail = editingStageCategory === "complete";
  const actionPending = saving || approving || deleting || sending;

  return (
    <MarketingShell>
      <div className="mx-auto max-w-7xl space-y-8 p-8">
        {/* Echoed Header Section from queue page */}
        <section className="grid grid-cols-12 gap-6">
          <div className="relative col-span-12 flex min-h-[320px] flex-col justify-between overflow-hidden rounded-xl border-l-2 border-chart-3 bg-card p-8 shadow-ambient lg:col-span-8">
            <div className="relative z-10">
              <span className="font-data text-xs font-bold uppercase tracking-[0.2em] text-secondary-foreground">
                Audit Pipeline
              </span>
              <h1 className="mt-2 max-w-2xl font-headline text-5xl font-extrabold leading-none tracking-tighter text-foreground">
                Outreach <span className="text-chart-3">Approval Queue</span>
              </h1>
              <p className="mt-4 max-w-lg text-muted-foreground">
                Review, edit, and approve auto-generated outbound email drafts before dispatching. A human-in-the-loop
                audit maintains lead comfort and conversion authenticity.
              </p>
            </div>
            <div className="z-10 mt-8">
              <div className="mb-2 flex items-end justify-between">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Approval Action Progress
                </span>
                <span className="text-lg font-bold text-secondary-foreground">
                  {draftCount > 0 ? "Pending Decision" : "Queue Fully Audited"}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-chart-3" style={{ width: draftCount > 0 ? "50%" : "100%" }} />
              </div>
            </div>
            <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-20">
              <div className="absolute inset-0 bg-linear-to-l from-chart-3/20 to-transparent" />
            </div>
          </div>

          <div className="col-span-12 grid gap-6 lg:col-span-4">
            <div className="flex flex-col justify-center rounded-lg border-l-2 border-secondary/40 bg-muted/60 p-6">
              <span className="font-data text-[10px] uppercase tracking-widest text-muted-foreground">
                Pending Drafts
              </span>
              <span className="mt-1 font-headline text-4xl font-bold text-foreground gap-2 flex items-center">
                {draftCount}
                <span className="text-xs text-secondary-foreground/70">Drafts</span>
              </span>
            </div>
            <div className="flex flex-col justify-center rounded-lg border-l-2 border-secondary/40 bg-muted/60 p-6">
              <span className="font-data text-[10px] uppercase tracking-widest text-muted-foreground">
                Approval Protocol
              </span>
              <span className="mt-1 font-headline text-xl font-bold text-foreground">Human-In-The-Loop</span>
              <div className="mt-4 font-data text-[10px] text-chart-1">100% SECURE AUTONOMY</div>
            </div>
          </div>
        </section>

        {/* Dynamic Split Screen Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:items-stretch">
          {/* Left Column: Drafts Queue (col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <Typography.H4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Inbox Queue
              </Typography.H4>
              <LeadStatusFilter value={statusFilter} onChange={handleFilterChange} />
            </div>
            <div className="space-y-3">
              {visibleLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  isSelected={editingLead?.id === lead.id}
                  onSelect={setEditingLead}
                />
              ))}
              {visibleLeads.length === 0 && (
                <div className="rounded-xl border border-dashed border-outline-ghost/20 bg-card/10 p-10 text-center">
                  <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                    No leads match this status filter.
                  </p>
                </div>
              )}
            </div>
            <ListPagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
          </div>

          {/* Right Column: Audit Panel & Email Editor (col-span-7) */}
          <div className="lg:col-span-7">
            {editingLead ? (
              <div className="space-y-6">
                <Typography.H4 className="text-xs font-bold uppercase tracking-widest text-accent">
                  Draft Workspace
                </Typography.H4>
                <div className="p-1.5 rounded-[2.5rem] sm:bg-transparent md:bg-linear-to-tr from-primary/10 to-accent/10 ring-1 ring-white/10 dark:ring-white/10 shadow-xl">
                  <div className="p-8 rounded-[calc(2.5rem-0.375rem)] bg-card/50 backdrop-blur-md space-y-6">
                    {/* Lead Title Block */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-ghost/10 pb-5">
                      <div className="space-y-1">
                        <Typography.H2 className="text-xl font-bold text-foreground mt-0 mb-0">
                          {editingLead.customerName ?? "Unknown Prospect"}
                        </Typography.H2>
                        {editingLead.scrapedData?.websiteUrl && (
                          <Link
                            href={editingLead.scrapedData.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] mt-4 font-bold uppercase tracking-widest hover:text-accent/50 flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3 text-primary dark:text-primary-kinetic" />
                            Visit Website
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Audit Summary Details */}
                    <div className="space-y-4">
                      {editingLead.scrapedData?.businessDescription && (
                        <div className="bg-linear-to-r from-primary/10 via-accent/20 to-accent/10 border border-outline-ghost/10 rounded-xl p-4 space-y-1.5 shadow-lg">
                          <Label className="text-sm font-bold uppercase tracking-wider text-orange-300">
                            Company Intel
                          </Label>
                          <p className="text-sm text-foreground/80 leading-relaxed font-semibold">
                            {editingLead.scrapedData.businessDescription}
                          </p>
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="bg-muted border-2 border-primary/10 rounded-xl p-4 flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">Chatbot Detector</span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border-2 shadow-md ${editingLead.scrapedData?.websiteUrl ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-primary/10 text-primary border-primary/20"}`}
                          >
                            {editingLead.scrapedData?.websiteUrl ? "None detected" : "Graft AI Agent Present"}
                          </span>
                        </div>

                        <div className="bg-muted border-2 border-primary/10 rounded-xl p-4 flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">Decision State</span>
                          {editingPipelineStatus && <PipelineStatusBadge status={editingPipelineStatus} />}
                        </div>
                      </div>

                      {Boolean(matchIndustries || matchLocations) && (
                        <div className="p-4 rounded-xl border border-outline-ghost/10 bg-muted/10 text-xs text-muted-foreground space-y-1">
                          <p className="font-semibold text-foreground text-[11px]">Match Context:</p>
                          {Boolean(matchIndustries) && <p>• Industries: {formatMatchList(matchIndustries)}</p>}
                          {Boolean(matchLocations) && <p>• Locations: {formatMatchList(matchLocations)}</p>}
                        </div>
                      )}
                    </div>

                    {/* Email Compose Area */}
                    <div className="space-y-4 border-t border-outline-ghost/10 pt-6">
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-xs font-bold text-foreground">
                          Email Subject Line
                        </Label>
                        <Input
                          id="subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="e.g. Collaboration Proposal - Graft Today"
                          className="bg-background border-outline-ghost/20 focus-visible:ring-primary text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="valuePropBody" className="text-xs font-bold text-foreground">
                          Email Draft Body
                        </Label>
                        <Textarea
                          id="valuePropBody"
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          placeholder="Type outreach email..."
                          rows={10}
                          className="bg-background border-outline-ghost/20 focus-visible:ring-primary text-sm leading-relaxed resize-none"
                        />
                      </div>

                      {editingLead.engagement && (
                        <DraftLinkSelector
                          key={editingLead.id}
                          engagement={editingLead.engagement}
                          onInsert={(href) => {
                            setBody((prev) => (prev.trim() ? `${prev}\n\n${href}` : href));
                            toast.success("Prototype link inserted into draft.");
                          }}
                        />
                      )}
                    </div>

                    {/* Action Panel Buttons (Bento Style row) */}
                    <div className="pt-4 border-t border-outline-ghost/10 flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="outline"
                        size="lg"
                        className="sm:flex-1 h-11 text-xs font-bold uppercase tracking-wider active:scale-[0.98] transition-all duration-300"
                        onClick={() => handleSave(editingLead.id)}
                        disabled={actionPending}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Draft
                          </>
                        )}
                      </Button>

                      {canApprove && (
                        <Button
                          variant="default"
                          size="lg"
                          className="sm:flex-1 h-11 bg-primary text-primary-foreground font-bold uppercase tracking-wider shadow-neon active:scale-[0.98] transition-all duration-300"
                          onClick={() => handleApprove(editingLead.id)}
                          disabled={actionPending}
                        >
                          {approving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Approve Engagement
                            </>
                          )}
                        </Button>
                      )}

                      {canSendEmail && (
                        <Button
                          variant="default"
                          size="lg"
                          className="sm:flex-1 h-11 bg-primary text-primary-foreground font-bold uppercase tracking-wider shadow-neon active:scale-[0.98] transition-all duration-300"
                          onClick={() => handleSendEmail(editingLead.id)}
                          disabled={actionPending}
                        >
                          {sending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </>
                          )}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-[0.95] transition-all duration-300"
                        onClick={() => handleDelete(editingLead.id)}
                        disabled={actionPending}
                        title="Delete and Decline"
                      >
                        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full border border-dashed border-outline-ghost/20 rounded-[2.5rem] py-24 text-center text-muted-foreground bg-card/10">
                <div className="w-12 h-12 rounded-full border border-outline-ghost/10 flex items-center justify-center mb-4 bg-muted/20">
                  <FileText className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <Typography.H4 className="text-sm font-bold text-foreground">Select a draft</Typography.H4>
                <p className="text-[11px] text-muted-foreground/60 max-w-[240px] mt-1 leading-relaxed">
                  Choose a pending prospect draft from the left queue to begin your human-in-the-loop review.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
