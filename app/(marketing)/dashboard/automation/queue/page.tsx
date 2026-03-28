"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Typography } from "@/components/ui/typography";
import { TriageTable } from "./_components/triage-table";

interface TriageLead {
  id: string;
  customerName: string | null;
  status: string;
  createdAt: string;
  scrapedData: {
    websiteUrl?: string;
    draftSubject?: string;
  } | null;
}

interface ProspectingConfig {
  cronEnabled: boolean;
  cronFrequency: string;
  cronDay: number | null;
  cronTime: string;
  cronStartDate: string | null;
  searchEnabled: boolean;
  searchCriteria: { industries?: string[]; locations?: string[]; keywords?: string[] } | null;
  valueProposition: string | null;
  outreachFromEmail: string | null;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function utcToSast(utcTime: string): string {
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
  const targetParts = [
    ...(criteria?.industries ?? []),
    ...(criteria?.locations ?? []),
    ...(criteria?.keywords ?? []),
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-2 w-2 rounded-full ${
              config.cronEnabled ? "bg-green-500" : "bg-muted-foreground"
            }`}
          />
          <Typography.Small className="font-medium">
            {config.cronEnabled ? "Active" : "Paused"}
          </Typography.Small>
        </div>
        <Link
          href="/dashboard/automation"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Edit config →
        </Link>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
        <div>
          <Typography.Small className="text-muted-foreground">Schedule</Typography.Small>
          <p className="mt-0.5 font-medium">{scheduleLabel}</p>
          {config.cronStartDate && (
            <p className="text-xs text-muted-foreground mt-0.5">
              From {new Date(config.cronStartDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>

        <div>
          <Typography.Small className="text-muted-foreground">Targeting</Typography.Small>
          <p className="mt-0.5 font-medium">
            {targetParts.length > 0 ? targetParts.join(", ") : "Not configured"}
          </p>
        </div>

        <div>
          <Typography.Small className="text-muted-foreground">Value proposition</Typography.Small>
          <p className="mt-0.5 font-medium line-clamp-2">
            {config.valueProposition ?? "Not set"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function QueuePage() {
  const [leads, setLeads] = useState<TriageLead[]>([]);
  const [config, setConfig] = useState<ProspectingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetch on mount only
  useEffect(() => {
    async function fetchAll() {
      try {
        const [leadsRes, configRes] = await Promise.all([
          fetch("/api/leads"),
          fetch("/api/prospecting-config"),
        ]);

        if (leadsRes.status === 401 || leadsRes.status === 403) {
          setMessage({ type: "error", text: "Access denied." });
          return;
        }

        const [leadsData, configData] = await Promise.all([
          leadsRes.json(),
          configRes.ok ? configRes.json() : null,
        ]);

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
      <div className="container max-w-4xl py-8">
        <Typography.P className="text-muted-foreground">Loading…</Typography.P>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div>
        <Link href="/dashboard/automation" className="text-muted-foreground hover:text-foreground text-sm">
          ← Automation
        </Link>
        <Typography.H1 className="mt-2">Prospect Queue</Typography.H1>
        <Typography.Lead className="mt-1">
          Scheduled prospecting job and all results generated by the pipeline.
        </Typography.Lead>
      </div>

      {message && (
        <div className="rounded-lg p-4 bg-destructive/10 text-destructive">
          <Typography.Small>{message.text}</Typography.Small>
        </div>
      )}

      {/* Scheduled job */}
      <div>
        <Typography.H3 className="mb-3">Scheduled Job</Typography.H3>
        {config ? (
          <ScheduledJobCard config={config} />
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <Typography.Small className="text-muted-foreground">
              No job configured.{" "}
              <Link href="/dashboard/automation" className="underline hover:text-foreground">
                Set up your prospecting config
              </Link>{" "}
              to get started.
            </Typography.Small>
          </div>
        )}
      </div>

      {/* Results */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <Typography.H3>Results</Typography.H3>
          <Typography.Small className="text-muted-foreground">
            {leads.length} prospect{leads.length !== 1 ? "s" : ""} total
          </Typography.Small>
        </div>
        <TriageTable leads={leads} />
      </div>
    </div>
  );
}
