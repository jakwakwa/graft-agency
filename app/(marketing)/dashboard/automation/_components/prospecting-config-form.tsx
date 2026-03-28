"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Typography } from "@/components/ui/typography";

// SAST is always UTC+2 (no daylight saving)
function utcToSast(utcTime: string): string {
  const [h = 0, m = 0] = utcTime.split(":").map(Number);
  const sast = (h + 2) % 24;
  return `${String(sast).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function sastToUtc(sastTime: string): string {
  const [h = 0, m = 0] = sastTime.split(":").map(Number);
  const utc = (h - 2 + 24) % 24;
  return `${String(utc).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

interface ProspectingConfig {
  cronEnabled: boolean;
  cronFrequency: "daily" | "weekly";
  cronDay: number | null;
  cronTime: string;
  cronStartDate: string | null;
  searchEnabled: boolean;
  searchCriteria: { industries: string[]; locations: string[]; keywords: string[] } | null;
  outreachFromEmail: string | null;
  valueProposition: string | null;
}

export function ProspectingConfigForm({
  onMessage,
}: {
  onMessage: (msg: { type: "success" | "error"; text: string }) => void;
}) {
  const [config, setConfig] = useState<ProspectingConfig>({
    cronEnabled: false,
    cronFrequency: "daily",
    cronDay: null,
    cronTime: "22:45",
    cronStartDate: null,
    searchEnabled: false,
    searchCriteria: { industries: [], locations: [], keywords: [] },
    outreachFromEmail: null,
    valueProposition: null,
  });
  const [industries, setIndustries] = useState("");
  const [locations, setLocations] = useState("");
  const [keywords, setKeywords] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [valueProposition, setValueProposition] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/prospecting-config");
        if (!res.ok) return;
        const data = await res.json();
        setConfig({
          cronEnabled: data.cronEnabled ?? false,
          cronFrequency: data.cronFrequency ?? "daily",
          cronDay: data.cronDay ?? null,
          cronTime: utcToSast(data.cronTime ?? "22:45"),
          cronStartDate: data.cronStartDate ? data.cronStartDate.split("T")[0] : null,
          searchEnabled: data.searchEnabled ?? false,
          searchCriteria: data.searchCriteria,
          outreachFromEmail: data.outreachFromEmail,
          valueProposition: data.valueProposition,
        });
        const criteria = data.searchCriteria ?? { industries: [], locations: [], keywords: [] };
        setIndustries(criteria.industries?.join(", ") ?? "");
        setLocations(criteria.locations?.join(", ") ?? "");
        setKeywords(criteria.keywords?.join(", ") ?? "");
        setFromEmail(data.outreachFromEmail ?? "");
        setValueProposition(data.valueProposition ?? "");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const splitTrim = (s: string) => s.split(",").map((v) => v.trim()).filter(Boolean);
      const res = await fetch("/api/prospecting-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cronEnabled: config.cronEnabled,
          cronFrequency: config.cronFrequency,
          cronDay: config.cronFrequency === "weekly" ? (config.cronDay ?? 1) : null,
          cronTime: sastToUtc(config.cronTime),
          cronStartDate: config.cronStartDate ? new Date(config.cronStartDate).toISOString() : null,
          searchEnabled: config.searchEnabled,
          searchCriteria: {
            industries: splitTrim(industries),
            locations: splitTrim(locations),
            keywords: splitTrim(keywords),
          },
          outreachFromEmail: fromEmail || null,
          valueProposition: valueProposition || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      onMessage({ type: "success", text: "Prospecting config saved." });
    } catch {
      onMessage({ type: "error", text: "Failed to save config." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Typography.P className="text-muted-foreground">Loading config...</Typography.P>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.cronEnabled}
            onChange={(e) => setConfig((c) => ({ ...c, cronEnabled: e.target.checked }))}
          />
          Cron enabled
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.searchEnabled}
            onChange={(e) => setConfig((c) => ({ ...c, searchEnabled: e.target.checked }))}
          />
          Auto-search for prospects in cron
        </label>
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-4 space-y-3">
        <Typography.Small className="font-medium text-muted-foreground uppercase tracking-wide">Cron Schedule</Typography.Small>
        <Typography.Muted className="text-xs leading-relaxed">
          Set your schedule here. Times use SAST (GMT+2); we convert to UTC and snap to 15-minute intervals.
        </Typography.Muted>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="cronFrequency" className="text-sm font-medium">Frequency</Label>
            <select
              id="cronFrequency"
              value={config.cronFrequency}
              onChange={(e) => setConfig((c) => ({ ...c, cronFrequency: e.target.value as "daily" | "weekly", cronDay: e.target.value === "weekly" ? (c.cronDay ?? 1) : null }))}
              className="mt-1 flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          {config.cronFrequency === "weekly" && (
            <div>
              <Label htmlFor="cronDay" className="text-sm font-medium">Day of week</Label>
              <select
                id="cronDay"
                value={config.cronDay ?? 1}
                onChange={(e) => setConfig((c) => ({ ...c, cronDay: Number(e.target.value) }))}
                className="mt-1 flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label htmlFor="cronTime" className="text-sm font-medium">Time (SAST / GMT+2)</Label>
            <input
              id="cronTime"
              type="time"
              value={config.cronTime}
              onChange={(e) => setConfig((c) => ({ ...c, cronTime: e.target.value }))}
              className="mt-1 flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
            />
          </div>

          <div>
            <Label htmlFor="cronStartDate" className="text-sm font-medium">Start date</Label>
            <input
              id="cronStartDate"
              type="date"
              value={config.cronStartDate ?? ""}
              onChange={(e) => setConfig((c) => ({ ...c, cronStartDate: e.target.value || null }))}
              className="mt-1 flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="industries" className="text-sm font-medium">Industries</Label>
          <Input
            id="industries"
            value={industries}
            onChange={(e) => setIndustries(e.target.value)}
            placeholder="e.g. accounting, dental, real estate"
          />
        </div>
        <div>
          <Label htmlFor="locations" className="text-sm font-medium">Locations</Label>
          <Input
            id="locations"
            value={locations}
            onChange={(e) => setLocations(e.target.value)}
            placeholder="e.g. Cape Town, Johannesburg"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="keywords" className="text-sm font-medium">Keywords</Label>
        <Input
          id="keywords"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="e.g. no chatbot, small business"
        />
      </div>

      <div>
        <Label htmlFor="fromEmail" className="text-sm font-medium">Outreach from email</Label>
        <Input
          id="fromEmail"
          type="email"
          value={fromEmail}
          onChange={(e) => setFromEmail(e.target.value)}
          placeholder="outreach@yourdomain.com"
        />
      </div>

      <div>
        <Label htmlFor="valueProposition" className="text-sm font-medium">Value proposition</Label>
        <textarea
          id="valueProposition"
          value={valueProposition}
          onChange={(e) => setValueProposition(e.target.value)}
          placeholder="e.g. We build AI voice agents that answer calls 24/7 so you never miss a lead."
          rows={3}
          className="mt-1 flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
        />
      </div>

      <Button variant="default" size="sm" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Config"}
      </Button>
    </div>
  );
}
