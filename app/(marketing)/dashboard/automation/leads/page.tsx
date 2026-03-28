"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Typography } from "@/components/ui/typography";
import { LeadDetailCard } from "./_components/lead-detail-card";
import { LeadsTable } from "./_components/leads-table";

interface LeadItem {
  id: string;
  customerName: string | null;
  status: string;
  scrapedData: { draftSubject?: string; draftBody?: string; websiteUrl?: string; [key: string]: unknown } | null;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingLead, setEditingLead] = useState<LeadItem | null>(null);

  async function fetchLeads() {
    setLoading(true);
    try {
      const res = await fetch("/api/leads?status=DRAFT_PENDING");
      if (res.status === 401) {
        setMessage({ type: "error", text: "Please sign in to view leads." });
        setLeads([]);
        return;
      }
      if (res.status === 403) {
        setMessage({ type: "error", text: "Access denied. This area is for platform owners only." });
        setLeads([]);
        return;
      }
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch {
      setMessage({ type: "error", text: "Failed to load leads." });
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetch on mount only
  useEffect(() => {
    fetchLeads();
  }, []);

  async function handleApprove(id: string) {
    try {
      const res = await fetch(`/api/leads/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Approve failed");
      setMessage({ type: "success", text: "Lead approved and email sent." });
      setEditingLead(null);
      fetchLeads();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to approve." });
    }
  }

  async function handleSave(
    id: string,
    updates: { draftSubject?: string; draftBody?: string },
  ) {
    const lead = leads.find((l) => l.id === id);
    const merged = { ...(lead?.scrapedData ?? {}), ...updates };
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scrapedData: merged }),
    });
    if (!res.ok) throw new Error("Save failed");
    setMessage({ type: "success", text: "Draft saved." });
    fetchLeads();
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <Typography.P className="text-muted-foreground">Loading…</Typography.P>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div>
        <Link href="/dashboard/automation" className="text-muted-foreground hover:text-foreground">
          ← Automation
        </Link>
        <Typography.H1 className="mt-2">Draft Leads</Typography.H1>
        <Typography.Lead className="mt-1">Review and approve draft outreach before dispatch.</Typography.Lead>
      </div>

      {message && (
        <div
          className={`mt-4 rounded-lg p-4 ${
            message.type === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}
        >
          <Typography.Small>{message.text}</Typography.Small>
        </div>
      )}

      <div className="mt-8">
        <Typography.H3>DRAFT_PENDING leads</Typography.H3>
        <LeadsTable
          leads={leads}
          onApprove={handleApprove}
          onEdit={(id) => setEditingLead(leads.find((l) => l.id === id) ?? null)}
        />
      </div>

      {editingLead && (
        <LeadDetailCard
          id={editingLead.id}
          customerName={editingLead.customerName}
          scrapedData={editingLead.scrapedData}
          onApprove={handleApprove}
          onSave={handleSave}
          onClose={() => setEditingLead(null)}
        />
      )}
    </div>
  );
}
