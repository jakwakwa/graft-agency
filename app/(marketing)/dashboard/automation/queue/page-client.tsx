"use client";

import { ChevronRight, Timer } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MarketingShell } from "@/components/layout/marketing-shell";

interface TriageLead {
  id: string;
  customerName: string | null;
  status: string;
  createdAt: string;
  engagementStage?: string;
  scrapedData: {
    websiteUrl?: string;
    draftSubject?: string;
  } | null;
}

interface ProspectingConfig {
  cronEnabled: boolean;
  cronFrequency: string;
  cronDay: number | null;
  cronTime?: string | null;
  cronStartDate: string | null;
  searchEnabled: boolean;
  searchCriteria: { industries?: string[]; locations?: string[]; keywords?: string[] } | null;
  valueProposition: string | null;
  outreachFromEmail: string | null;
}

const LIVE_LOG = [
  {
    t: "03:12:04",
    tag: "[SCANNER]",
    tone: "text-chart-4",
    msg: 'Target Found: "Nexus Logic Corp" - Analyzing Tech Stack...',
  },
  { t: "03:12:45", tag: "[ANALYSIS]", tone: "text-chart-4", msg: "Fit Score: 94%. ICP Match confirmed." },
  {
    t: "03:13:12",
    tag: "[GRAFT]",
    tone: "text-chart-3",
    msg: "Personalized Pitch Generated for CEO @ Nexus.",
    bold: true,
  },
  {
    t: "03:14:02",
    tag: "[SCANNER]",
    tone: "text-chart-4",
    msg: "Filtering LinkedIn Data for 500+ employee firms in SF...",
  },
  {
    t: "03:14:58",
    tag: "[SYSTEM]",
    tone: "text-destructive",
    msg: 'Target "Vertex" skipped. Reason: Low Growth Signal.',
  },
  { t: "03:15:30", tag: "[GRAFT]", tone: "text-chart-3", msg: 'Dispatching agent to prospect "Synthetix AI".' },
  { t: "03:16:15", tag: "[ANALYSIS]", tone: "text-chart-4", msg: "Synthetix AI: 5 decision makers identified." },
];

function initialsFromName(name: string | null): string {
  if (!name) return "NA";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() ?? "NA";
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

export default function QueuePage() {
  const [leads, setLeads] = useState<TriageLead[]>([]);
  const [config, setConfig] = useState<ProspectingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [leadsRes, configRes] = await Promise.all([fetch("/api/leads"), fetch("/api/prospecting-config")]);

        if (leadsRes.status === 401 || leadsRes.status === 403) {
          setMessage({ type: "error", text: "Access denied." });
          return;
        }

        const [leadsData, configData] = await Promise.all([leadsRes.json(), configRes.ok ? configRes.json() : null]);

        setLeads(Array.isArray(leadsData) ? leadsData : []);
        setConfig(configData);
      } catch {
        setMessage({ type: "error", text: "Failed to load." });
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-16 animate-pulse rounded-xl bg-muted" />
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 h-72 animate-pulse rounded-xl bg-muted lg:col-span-8" />
            <div className="col-span-12 space-y-6 lg:col-span-4">
              <div className="h-32 animate-pulse rounded-xl bg-muted" />
              <div className="h-32 animate-pulse rounded-xl bg-muted" />
            </div>
          </div>
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 h-[500px] animate-pulse rounded-xl bg-card lg:col-span-5" />
            <div className="col-span-12 h-[500px] animate-pulse rounded-xl bg-muted lg:col-span-7" />
          </div>
        </div>
      </div>
    );
  }

  const qualifiedProspects = leads.filter((lead) => lead.status !== "CLOSED");
  const highlightedLeads = qualifiedProspects.slice(0, 3);
  const foundToday = qualifiedProspects.length;
  const pitchProgress = config?.cronEnabled
    ? "scheduled"
    : config?.cronTime
      ? `${config?.cronTime + " - " + config?.cronFrequency + " " + (config.searchEnabled ? "enabled" : "schedule disabled")}`
      : "";

  return (
    <MarketingShell>
      <div className="mx-auto max-w-7xl space-y-8 p-8">
        {message && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground">
            {message.text}
          </div>
        )}

        <section className="grid grid-cols-12 gap-6">
          <div className="relative col-span-12 flex min-h-[320px] flex-col justify-between overflow-hidden rounded-xl border-l-2 border-chart-3 bg-card p-8 shadow-ambient lg:col-span-8">
            <div className="relative z-10">
              <span className="font-data text-xs font-bold uppercase tracking-[0.2em] text-secondary-foreground">
                Autonomous Engine Status
              </span>
              <h1 className="mt-2 max-w-2xl font-headline text-5xl font-extrabold leading-none tracking-tighter text-foreground">
                {foundToday} New Qualified Prospects <span className="text-chart-3">Found Today</span>
              </h1>
              <p className="mt-4 max-w-lg text-muted-foreground">
                The Midnight Protocol is operating at {config?.cronEnabled ? "100%" : "67%"} efficiency. Targets are
                continuously vetted for intent and fit score.
              </p>
            </div>
            <div className="z-10 mt-8">
              <div className="mb-2 flex items-end justify-between">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Pitching Status Progress
                </span>
                <span className="text-lg font-bold text-secondary-foreground">{pitchProgress}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-chart-3" style={{ width: `${pitchProgress}` }} />
              </div>
            </div>
            <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-20">
              <div className="absolute inset-0 bg-linear-to-l from-chart-3/20 to-transparent" />
            </div>
          </div>

          <div className="col-span-12 grid gap-6 lg:col-span-4">
            <div className="flex flex-col justify-center rounded-lg border-l-2 border-secondary/40 bg-muted/60 p-6">
              <span className="font-data text-[10px] uppercase tracking-widest text-muted-foreground">
                Global Scan Depth
              </span>
              <span className="mt-1 font-headline text-4xl font-bold text-foreground gap-2 flex items-center">
                {Math.max(leads.length)}
                <span className="text-xs text-secondary-foreground/70">Leads</span>
              </span>
            </div>
            <div className="flex flex-col justify-center rounded-lg border-l-2 border-secondary/40 bg-muted/60 p-6">
              <span className="font-data text-[10px] uppercase tracking-widest text-muted-foreground">
                Avg Response Latency
              </span>
              <span className="mt-1 font-headline text-4xl font-bold text-foreground flex">
                {config?.cronEnabled ? "Scheduled Runner" : "Schedule Disabled"}{" "}
                <span className="text-xs text-secondary-foreground/70">
                  <span>
                    {" "}
                    <Timer />{" "}
                  </span>
                </span>
              </span>
              <div className="mt-4 font-data text-[10px] text-chart-1">OPTIMIZED TACTICAL ROUTING</div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-12 gap-8">
          <div className="col-span-12 flex h-[500px] flex-col overflow-hidden rounded-xl border border-outline-ghost bg-card lg:col-span-12 hidden">
            <div className="flex items-center justify-between border-b border-outline-ghost bg-muted/40 p-5">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary-kinetic" />
                <h3 className="font-display text-sm font-bold uppercase tracking-widest text-foreground">
                  Live Hunt Log
                </h3>
              </div>
              <span className="font-data text-[10px] text-muted-foreground">REAL-TIME DATA STREAM</span>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-6 text-xs">
              {LIVE_LOG.map((line) => (
                <div key={`${line.t}-${line.tag}`} className="flex gap-4">
                  <span className="text-muted-foreground">{line.t}</span>
                  <span className={line.tone}>{line.tag}</span>
                  <span className={line.bold ? "font-bold text-foreground" : "text-foreground"}>{line.msg}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 space-y-4 lg:col-span-12">
            <div className="mb-2 flex items-end justify-between">
              <h3 className="font-display text-lg font-bold text-foreground">High-Intent Targets</h3>
              <Link
                href="/dashboard/automation/queue/all"
                className="font-data text-xs text-secondary-foreground hover:underline"
              >
                VIEW ALL PROSPECTS
              </Link>
            </div>

            {(highlightedLeads.length === 0 ? highlightedLeads : leads.slice(0, 15)).map((lead, index) => {
              const statusLabel = lead.status === "CONTACTED" ? "DONE" : "PENDING";
              return (
                <Link
                  key={lead.id}
                  href={`/dashboard/automation/queue/${lead.id}`}
                  className="group relative flex items-center gap-6 overflow-hidden border-l-2 border-chart-5/40 bg-card p-5 transition-all duration-200 hover:bg-muted/80"
                >
                  <div className="absolute right-0 top-0 h-full w-1/4 bg-linear-to-l from-chart-3/10 to-transparent" />
                  <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-muted text-xl font-black text-secondary-foreground">
                    {initialsFromName(lead.customerName)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-foreground">{lead.customerName ?? "Unknown Prospect"}</h4>
                    <p className="text-xs text-muted-foreground">
                      {lead.scrapedData?.websiteUrl ? lead.scrapedData.websiteUrl : "Prospect in enrichment pipeline"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="mt-1 text-[10px] uppercase text-muted-foreground">{statusLabel}</div>
                  </div>
                  <span className="rounded-sm bg-card p-2 text-foreground transition-colors group-hover:bg-chart-3 group-hover:text-primary-foreground">
                    <ChevronRight className="h-[18px] w-[18px]" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-8 rounded-xl border border-outline-ghost bg-muted/50 p-6">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Active Engines</span>
              <span className="text-lg font-bold text-foreground">1,024</span>
            </div>
            <div className="h-8 w-px bg-outline-ghost" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Compute Load</span>
              <span className="text-lg font-bold text-foreground">24.2%</span>
            </div>
            <div className="h-8 w-px bg-outline-ghost" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Memory Integrity</span>
              <span className="text-lg font-bold text-secondary-foreground">Optimal</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-bold">
                A1
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-bold">
                B4
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-chart-3 text-[10px] font-bold text-primary-foreground">
                Z9
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-tight text-muted-foreground">
              Assigned Agents in Sector-9
            </span>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
