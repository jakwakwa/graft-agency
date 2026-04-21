"use client";

import { useEffect, useState } from "react";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { Button } from "@/components/ui-v2/button";
import { LeadDetailCard } from "./_components/lead-detail-card";

interface LeadItem {
  id: string;
  customerName: string | null;
  status: string;
  scrapedData: { draftSubject?: string; draftBody?: string; websiteUrl?: string; [key: string]: unknown } | null;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [_message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
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

  async function handleSave(id: string, updates: { draftSubject?: string; draftBody?: string }) {
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
      <div className="h-full bg-background p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-16 animate-pulse rounded-xl bg-muted" />
          <div className="h-40 animate-pulse rounded-xl bg-muted" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="h-[520px] animate-pulse rounded-xl bg-card" />
            <div className="h-[520px] animate-pulse rounded-xl bg-card lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  const activeLeads = leads.slice(0, 6);
  const qualifiedCount = leads.filter((lead) => lead.status !== "CLOSED").length;
  const _engagementRate = leads.length > 0 ? Math.min(99.9, 94 + leads.length * 0.7) : 98.4;
  const _revenueQualified = qualifiedCount * 7150;
  return (
    <MarketingShell>
      <div className="grid grid-cols-12 gap-8 px-8">
        <div className="col-span-7 flex flex-col">
          <h3 className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
            Live Pulse
            <div className="h-2 w-2 animate-pulse rounded-full bg-chart-3" />
          </h3>
          <span className="font-data text-xs text-muted-foreground">{activeLeads.length} ACTIVE NOW</span>

          <div className="flex flex-col space-y-3 lg:col-span-6 overflow-hidden">
            {activeLeads.map((lead, i) => (
              <Button
                key={lead.id}
                onClick={() => setEditingLead(lead)}
                className="mx-0 h-12 cursor-pointer border border-transparent bg-card transition-colors hover:border-outline-ghost hover:bg-muted/80"
              >
                <div className="grid grid-cols-15 h-12 gap-3">
                  <div className="mb-0 items-center justify-between col-span-7 flex  h-fit">
                    <div className="flex items-center gap-2 h-auto">
                      <div className="flex h-4 w-4 flex-col items-center justify-center rounded-sm bg-muted text-muted-foreground">
                        {lead.customerName?.slice(0, 1)?.toUpperCase() ?? "U"}
                      </div>
                      <div className="flex flex-col items-start gap-0 justify-center h-12">
                        <h4 className="text-xs font-bold">{lead.customerName ?? `Unknown Visitor #${420 + i}`}</h4>
                        <p className="text-[10px] text-muted-foreground">
                          {lead.scrapedData?.websiteUrl ? "LIVE SOURCE" : "AI DETECTED"}
                        </p>
                      </div>
                    </div>
                    <span className="animate-pulse rounded-sm bg-primary/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter text-secondary-foreground">
                      {lead.status === "DRAFT_PENDING" ? "Analyzing" : "Qualified"}
                    </span>
                  </div>
                  <div className="col-span-7 flex h-11 flex-col justify-center bg-muted/60 p-3">
                    <p className="overflow-hidden text-[12px] italic text-foreground">
                      &quot;
                      {lead.scrapedData?.draftBody?.slice(0, 92) ??
                        "I'm looking for a white-label solution for my marketing agency..."}
                      &quot;
                    </p>
                  </div>
                  <div className=" flex flex-col col-span-1 justify-center">
                    <span className="text-[8px] text-chart-5">LIVE LOG</span>
                    <span className="text-xs text-secondary-foreground">→</span>
                  </div>
                </div>
              </Button>
            ))}
            <Button className="flex w-full items-center justify-center gap-2 border border-dashed border-outline-ghost py-2 text-xs font-semibold text-foreground hover:text-secondary-foreground">
              View All Active Streams
            </Button>
          </div>
        </div>

        <div className="col-span-5">
          <div className="flex flex-col items-center justify-between">
            <h3 className="font-display text-xl font-bold uppercase tracking-tight text-foreground">
              Consultations Booked
            </h3>
            <div className="flex gap-2 text-muted-foreground">
              <Button className="p-1 hover:text-foreground">Calendar</Button>
              <Button className="p-1 hover:text-foreground">List</Button>
            </div>

            <div className="w-full space-y-6 rounded-sm border border-outline-ghost bg-card p-6">
              <div className="mb-6 grid grid-cols-7 overflow-hidden rounded-sm border border-outline-ghost bg-muted">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div
                    key={day}
                    className={`bg-card p-2 text-center text-[10px] font-bold uppercase ${
                      day === "Fri" ? "text-secondary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {day}
                  </div>
                ))}
                {[21, 22, 23, 24, 25, 26, 27].map((day) => (
                  <div
                    key={day}
                    className={`h-24 p-2 text-xs ${
                      day === 25
                        ? "bg-sidebar-accent font-bold text-secondary-foreground"
                        : "bg-card text-muted-foreground"
                    }`}
                  >
                    {day}
                    {day === 25 && (
                      <>
                        <div className="inset-x-1 top-8 rounded-sm bg-chart-3 p-1.5">
                          <p className="text-[9px] font-bold leading-tight text-primary-foreground">
                            10:00 AM Discovery
                          </p>
                        </div>
                        <div className="inset-x-1 top-16 rounded-sm bg-muted p-1.5">
                          <p className="text-[9px] font-medium leading-tight text-foreground">2:30 PM Onboard</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <div className="mb-4 flex items-center gap-2">
                  <h4 className="font-data text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Agent Decision Stream
                  </h4>
                </div>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-sm bg-muted/50 p-4 font-mono text-[11px] text-secondary-foreground/80">
                  <p>
                    <span className="text-muted-foreground">15:24:02</span> [INTENT] Analyzing user query...{" "}
                    <span className="text-chart-3">MATCH FOUND: WHITELABEL</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">15:24:05</span> [ACTION] Deploying value-prop sequence
                    #04...
                  </p>
                  <p>
                    <span className="text-muted-foreground">15:24:10</span> [CAPTURE] Extracting budget parameters...{" "}
                    <span className="text-chart-3">EST: $50k+</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">15:24:12</span> [CALENDAR] Checking availability for Fri,
                    Oct 25...
                  </p>
                  <p>
                    <span className="text-muted-foreground">15:24:15</span> [SUCCESS] Lead Qualified. Routing to
                    High-Priority Queue.
                  </p>
                  <p className="animate-pulse">_</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-sm border border-outline-ghost bg-muted/50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1 text-primary-foreground">
                C
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-bold text-foreground">Calendly Integration Active</h5>
                <p className="text-xs text-muted-foreground">Synchronizing 4 team calendars in real-time.</p>
              </div>
              <Button className="text-xs font-bold uppercase tracking-tighter text-secondary-foreground transition-colors hover:text-chart-5">
                Manage Sync
              </Button>
            </div>
          </div>
        </div>
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
    </MarketingShell>
  );
}
