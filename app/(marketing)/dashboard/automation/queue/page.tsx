"use client";

import { ArrowLeft, Clock, Cpu, List, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Typography } from "@/components/ui/typography";
import { TriageTable } from "./_components/triage-table";

interface TriageLead {
  id: string;
  customerName: string | null;
  status: string;
  createdAt: string;
  attioRecordId: string | null;
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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function utcToSast(utcTime: string | null | undefined): string {
  if (!utcTime || !/^\d{2}:\d{2}$/.test(utcTime)) {
    return "--:--";
  }
  const [h = 0, m = 0] = utcTime.split(":").map(Number);
  const sast = (h + 2) % 24;
  return `${String(sast).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function ScheduledJobCard({ config }: { config: ProspectingConfig }) {
  const scheduleLabel =
    config.cronFrequency === "weekly" && config.cronDay !== null
      ? `Weekly on ${DAYS[config.cronDay]} at ${utcToSast(config.cronTime)} SAST`
      : `Daily at ${utcToSast(config.cronTime)} SAST`;

  const criteria = config.searchCriteria;
  const targetParts = [...(criteria?.industries ?? []), ...(criteria?.locations ?? []), ...(criteria?.keywords ?? [])];

  return (
    <div className="glass-card p-8 rounded-2xl border-l-4 border-primary relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-2 w-2 rounded-full ${
              config.cronEnabled ? "bg-green-500 shadow-neon" : "bg-muted-foreground"
            }`}
          />
          <Typography.Small className="font-data uppercase tracking-widest text-[10px]">
            {config.cronEnabled ? "Active" : "Paused"}
          </Typography.Small>
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-3">
        <div className="space-y-1">
          <Typography.Small className="text-muted-foreground uppercase tracking-widest text-[10px] font-data">
            Schedule
          </Typography.Small>
          <p className="font-bold text-foreground">{scheduleLabel}</p>
          {config.cronStartDate && (
            <p className="text-[10px] text-muted-foreground font-data">
              FROM{" "}
              {new Date(config.cronStartDate)
                .toLocaleDateString("en-ZA", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
                .toUpperCase()}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Typography.Small className="text-muted-foreground uppercase tracking-widest text-[10px] font-data">
            Targeting
          </Typography.Small>
          <p className="font-bold text-foreground">
            {targetParts.length > 0 ? targetParts.join(", ") : "Not configured"}
          </p>
        </div>

        <div className="space-y-1">
          <Typography.Small className="text-muted-foreground uppercase tracking-widest text-[10px] font-data">
            Value Proposition
          </Typography.Small>
          <p className="font-bold text-foreground line-clamp-2 italic">
            &quot;{config.valueProposition ?? "Not set"}&quot;
          </p>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-outline-ghost/10 flex justify-end">
        <Link
          href="/dashboard/automation"
          className="text-xs font-data uppercase tracking-widest text-primary hover:text-primary-kinetic transition-colors flex items-center gap-1"
        >
          Edit Configuration
          <Settings className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

export default function QueuePage() {
  const [leads, setLeads] = useState<TriageLead[]>([]);
  const [config, setConfig] = useState<ProspectingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      <div className="container max-w-6xl py-8 space-y-12">
        <div className="flex flex-col gap-4">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-12 w-64 animate-pulse rounded bg-muted" />
          <div className="h-6 w-full animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted/50" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-2xl bg-muted/30" />
      </div>
    );
  }

  const totalPages = Math.ceil(leads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLeads = leads.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="container max-w-6xl py-8 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link
            href="/dashboard/automation"
            className="text-muted-foreground hover:text-primary text-xs uppercase tracking-widest font-data flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Automation Hub
          </Link>
          <Typography.H1 className="mt-4 mb-0">Prospect Queue</Typography.H1>
          <Typography.Lead className="mt-2">
            Scheduled prospecting job and all results generated by the pipeline.
          </Typography.Lead>
        </div>
        <div className="flex items-center gap-3 glass-card p-3 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-primary-kinetic/20 flex items-center justify-center">
            <Cpu className="h-5 w-5 text-primary-kinetic" />
          </div>
          <div>
            <p className="text-xs font-data uppercase tracking-widest text-primary font-bold">Super Agent</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">High-Performance Active</p>
          </div>
        </div>
      </div>

      {message && (
        <div className="rounded-lg p-4 bg-destructive/10 text-destructive border border-destructive/20">
          <Typography.Small>{message.text}</Typography.Small>
        </div>
      )}

      {/* Scheduled job */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <Typography.H4 className="mb-0">Scheduled Job</Typography.H4>
        </div>
        {config ? (
          <ScheduledJobCard config={config} />
        ) : (
          <div className="rounded-2xl border border-dashed border-outline-ghost/30 p-12 text-center glass-card">
            <Typography.Small className="text-muted-foreground">
              No job configured.{" "}
              <Link href="/dashboard/automation" className="text-primary hover:underline">
                Set up your prospecting config
              </Link>{" "}
              to get started.
            </Typography.Small>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-secondary" />
            <Typography.H4 className="mb-0">Queue Results</Typography.H4>
          </div>
          <Typography.Small className="text-muted-foreground font-data uppercase tracking-widest text-[10px]">
            {leads.length} prospect{leads.length !== 1 ? "s" : ""} total
          </Typography.Small>
        </div>
        <TriageTable leads={currentLeads} />

        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
