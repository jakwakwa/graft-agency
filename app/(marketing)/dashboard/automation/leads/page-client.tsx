"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { Typography } from "@/components/ui/typography";
import { getStageCategory } from "@/lib/utils/engagement-stages";
import { getLeadPipelineStatus } from "@/lib/utils/lead-pipeline-status";
import { DraftWorkspace } from "./_components/draft-workspace";
import { EmptyQueue } from "./_components/empty-queue";
import { LeadCard } from "./_components/lead-card";
import { LeadStatusFilter, type LeadStatusFilterValue } from "./_components/lead-status-filter";
import { ListPagination } from "./_components/list-pagination";
import { QueueHeader } from "./_components/queue-header";
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
    return <EmptyQueue />;
  }

  const editingPipelineStatus = editingLead ? pipelineStatusOf(editingLead) : null;
  const editingStageCategory = getStageCategory(editingLead?.engagement?.stage ?? "NOT_STARTED");
  const canApprove = editingPipelineStatus === "draft";
  const canSendEmail = editingStageCategory === "complete";
  const actionPending = saving || approving || deleting || sending;

  return (
    <MarketingShell>
      <div className="mx-auto max-w-7xl space-y-8 p-8">
        <QueueHeader draftCount={draftCount} />

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
            <DraftWorkspace
              lead={editingLead}
              subject={subject}
              setSubject={setSubject}
              body={body}
              setBody={setBody}
              saving={saving}
              approving={approving}
              deleting={deleting}
              sending={sending}
              actionPending={actionPending}
              canApprove={canApprove}
              canSendEmail={canSendEmail}
              pipelineStatus={editingPipelineStatus}
              onSave={handleSave}
              onApprove={handleApprove}
              onSendEmail={handleSendEmail}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
