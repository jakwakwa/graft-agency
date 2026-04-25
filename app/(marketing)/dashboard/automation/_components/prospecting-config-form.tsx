"use client";

import { Calendar, CalendarDays, Clock, Globe, RefreshCw, Timer, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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

const AUTOMATION_TOAST = { duration: Infinity, closeButton: true } as const;

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

export function ProspectingConfigForm() {
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
      const splitTrim = (s: string) =>
        s
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
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
      toast.success("Prospecting config saved.", AUTOMATION_TOAST);
    } catch {
      toast.error("Failed to save config.", AUTOMATION_TOAST);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex gap-4">
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="h-6 w-48 rounded bg-muted" />
        </div>
        <div className="h-40 w-full rounded-xl bg-muted/50" />
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="h-10 rounded bg-muted" />
          <div className="h-10 rounded bg-muted" />
        </div>
        <div className="h-10 w-full rounded bg-muted" />
        <div className="h-32 w-full rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="space-y-12">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-data uppercase tracking-widest font-bold flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-primary" />
              Sales Aggression
            </span>
            <span className="text-primary font-data font-bold">85%</span>
          </div>
          <input
            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            max="100"
            min="0"
            type="range"
            value="85"
            readOnly
          />
          <p className="text-[10px] text-muted-foreground italic">
            Determines how quickly the agent pushes for a calendar booking after lead intent is detected.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-data uppercase tracking-widest font-bold flex items-center gap-2">
              <Globe className="h-3 w-3 text-secondary" />
              Local Nuance (Bakkie / Load Shedding)
            </span>
            <span className="text-secondary font-data font-bold">Max (Resilient)</span>
          </div>
          <input
            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-secondary"
            max="100"
            min="0"
            type="range"
            value="95"
            readOnly
          />
          <p className="text-[10px] text-muted-foreground italic">
            Adjusts dialect and situational awareness. Currently monitoring: Stage 0 (AI Resilience Active).
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-data uppercase tracking-widest font-bold flex items-center gap-2">
              <Timer className="h-3 w-3 text-muted-foreground" />
              Response Delay
            </span>
            <span className="text-muted-foreground font-data font-bold">Humanized (2-4m)</span>
          </div>
          <input
            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-muted-foreground"
            max="100"
            min="0"
            type="range"
            value="30"
            readOnly
          />
          <p className="text-[10px] text-muted-foreground italic">
            Simulates human typing and thinking time to maintain lead comfort and conversion authenticity.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-6 rounded-xl border border-outline-ghost/10 hover:border-primary/40 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="w-11 h-6 bg-muted rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-primary rounded-full" />
            </div>
          </div>
          <h4 className="text-sm font-data font-bold text-foreground mb-1">Calendly Sync</h4>
          <p className="text-[10px] text-muted-foreground">Live booking orchestration enabled.</p>
        </div>

        <div className="bg-card p-6 rounded-xl border border-outline-ghost/10 hover:border-primary/40 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-secondary" />
            </div>
            <div className="w-11 h-6 bg-muted rounded-full relative" />
          </div>
          <h4 className="text-sm font-data font-bold text-foreground mb-1">Cal.com</h4>
          <p className="text-[10px] text-muted-foreground">Connect for open-source scheduling.</p>
        </div>

        <div className="bg-card p-6 rounded-xl border border-outline-ghost/10 hover:border-primary/40 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-accent" />
            </div>
            <div className="w-11 h-6 bg-muted rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-primary rounded-full" />
            </div>
          </div>
          <h4 className="text-sm font-data font-bold text-foreground mb-1">CRM Sync</h4>
          <p className="text-[10px] text-muted-foreground">HubSpot/Salesforce active.</p>
        </div>
      </div>

      <div className="pt-8 border-t border-outline-ghost/10 space-y-6">
        <Typography.H4>System Configuration</Typography.H4>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="rounded border-outline-ghost bg-transparent text-primary focus:ring-primary"
              checked={config.cronEnabled}
              onChange={(e) => setConfig((c) => ({ ...c, cronEnabled: e.target.checked }))}
            />
            Cron enabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="rounded border-outline-ghost bg-transparent text-primary focus:ring-primary"
              checked={config.searchEnabled}
              onChange={(e) => setConfig((c) => ({ ...c, searchEnabled: e.target.checked }))}
            />
            Auto-search for prospects in cron
          </label>
        </div>

        <div className="rounded-xl border border-outline-ghost/20 bg-muted/10 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <Typography.Small className="font-medium text-muted-foreground uppercase tracking-wide">
              Cron Schedule
            </Typography.Small>
          </div>
          <Typography.Muted className="text-xs leading-relaxed">
            Set your schedule here. Times use SAST (GMT+2); we convert to UTC and snap to 15-minute intervals.
          </Typography.Muted>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cronFrequency" className="text-xs font-data uppercase tracking-wider">
                Frequency
              </Label>
              <select
                id="cronFrequency"
                value={config.cronFrequency}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    cronFrequency: e.target.value as "daily" | "weekly",
                    cronDay: e.target.value === "weekly" ? (c.cronDay ?? 1) : null,
                  }))
                }
                className="mt-1 flex h-10 w-full rounded-lg border border-outline-ghost/20 bg-background/50 px-3 py-1 text-sm outline-none focus:border-primary/50 transition-colors"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            {config.cronFrequency === "weekly" && (
              <div>
                <Label htmlFor="cronDay" className="text-xs font-data uppercase tracking-wider">
                  Day of week
                </Label>
                <select
                  id="cronDay"
                  value={config.cronDay ?? 1}
                  onChange={(e) => setConfig((c) => ({ ...c, cronDay: Number(e.target.value) }))}
                  className="mt-1 flex h-10 w-full rounded-lg border border-outline-ghost/20 bg-background/50 px-3 py-1 text-sm outline-none focus:border-primary/50 transition-colors"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label htmlFor="cronTime" className="text-xs font-data uppercase tracking-wider">
                Time (SAST / GMT+2)
              </Label>
              <input
                id="cronTime"
                type="time"
                value={config.cronTime}
                onChange={(e) => setConfig((c) => ({ ...c, cronTime: e.target.value }))}
                className="mt-1 flex h-10 w-full rounded-lg border border-outline-ghost/20 bg-background/50 px-3 py-1 text-sm outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div>
              <Label htmlFor="cronStartDate" className="text-xs font-data uppercase tracking-wider">
                Start date
              </Label>
              <input
                id="cronStartDate"
                type="date"
                value={config.cronStartDate ?? ""}
                onChange={(e) => setConfig((c) => ({ ...c, cronStartDate: e.target.value || null }))}
                className="mt-1 flex h-10 w-full rounded-lg border border-outline-ghost/20 bg-background/50 px-3 py-1 text-sm outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="industries" className="text-xs font-data uppercase tracking-wider">
              Industries
            </Label>
            <Input
              id="industries"
              className="mt-1 bg-background/50 border-outline-ghost/20"
              value={industries}
              onChange={(e) => setIndustries(e.target.value)}
              placeholder="e.g. accounting, dental, real estate"
            />
          </div>
          <div>
            <Label htmlFor="locations" className="text-xs font-data uppercase tracking-wider">
              Locations
            </Label>
            <Input
              id="locations"
              className="mt-1 bg-background/50 border-outline-ghost/20"
              value={locations}
              onChange={(e) => setLocations(e.target.value)}
              placeholder="e.g. Cape Town, Johannesburg"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="keywords" className="text-xs font-data uppercase tracking-wider">
            Keywords
          </Label>
          <Input
            id="keywords"
            className="mt-1 bg-background/50 border-outline-ghost/20"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g. no chatbot, small business"
          />
        </div>

        <div>
          <Label htmlFor="fromEmail" className="text-xs font-data uppercase tracking-wider">
            Outreach from email
          </Label>
          <Input
            id="fromEmail"
            type="email"
            className="mt-1 bg-background/50 border-outline-ghost/20"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder="outreach@yourdomain.com"
          />
        </div>

        <div>
          <Label htmlFor="valueProposition" className="text-xs font-data uppercase tracking-wider">
            Value proposition
          </Label>
          <textarea
            id="valueProposition"
            value={valueProposition}
            onChange={(e) => setValueProposition(e.target.value)}
            placeholder="e.g. We build AI voice agents that answer calls 24/7 so you never miss a lead."
            rows={3}
            className="mt-1 flex w-full rounded-lg border border-outline-ghost/20 bg-background/50 px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors resize-none"
          />
        </div>

        <Button
          variant="default"
          size="lg"
          className="w-full bg-gradient-to-r from-primary to-primary-kinetic text-primary-foreground font-black uppercase tracking-widest shadow-neon-primary hover:scale-[1.02] transition-transform"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}
