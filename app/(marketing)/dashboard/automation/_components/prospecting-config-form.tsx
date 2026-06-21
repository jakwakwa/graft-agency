"use client";

import { Clock, Globe, Loader2, Mail, MessageSquare, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Typography } from "@/components/ui/typography";

const AUTOMATION_TOAST = { duration: 5000, closeButton: true } as const;

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
  cronStartDate: string | null;
  searchCriteria: { industries: string[]; locations: string[]; keywords: string[] } | null;
  outreachFromEmail: string | null;
  valueProposition: string | null;
}

export function ProspectingConfigForm() {
  const [config, setConfig] = useState<ProspectingConfig>({
    cronEnabled: false,
    cronFrequency: "daily",
    cronDay: null,
    cronStartDate: null,
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
          cronStartDate: data.cronStartDate ? data.cronStartDate.split("T")[0] : null,
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
      } catch (error) {
        console.error("Failed to load prospecting config:", error);
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
          cronStartDate: config.cronStartDate ? new Date(config.cronStartDate).toISOString() : null,
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
      toast.success("Prospecting config saved successfully.", AUTOMATION_TOAST);
    } catch {
      toast.error("Failed to save configuration.", AUTOMATION_TOAST);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-full rounded-xl bg-muted/50" />
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="h-24 rounded-2xl bg-muted/30" />
          <div className="h-24 rounded-2xl bg-muted/30" />
        </div>
        <div className="h-40 w-full rounded-2xl bg-muted/30" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Cron Control (Switch) */}
      <div className="p-1.5 rounded-[2rem] bg-white/5 ring-1 ring-white/10 dark:ring-white/10">
        <div className="p-6 rounded-[calc(2rem-0.375rem)] bg-card/40 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label
                htmlFor="cron-enabled-toggle"
                className="text-sm font-bold text-foreground flex items-center gap-2"
              >
                <Clock className="h-4 w-4 text-primary" />
                Automated Prospecting Schedule
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[55ch]">
                When enabled, the background engine runs according to your specified frequency to find new high-intent
                target prospects.
              </p>
            </div>
            <button
              id="cron-enabled-toggle"
              type="button"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${config.cronEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}
              onClick={() => setConfig((c) => ({ ...c, cronEnabled: !c.cronEnabled }))}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-md ring-0 transition duration-300 ease-in-out ${config.cronEnabled ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          {config.cronEnabled && (
            <div className="pt-4 border-t border-outline-ghost/10 grid gap-4 sm:grid-cols-3">
              <div>
                <Label
                  htmlFor="cronFrequency"
                  className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                >
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
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-outline-ghost/20 bg-background px-3 py-1 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              {config.cronFrequency === "weekly" && (
                <div>
                  <Label
                    htmlFor="cronDay"
                    className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Day of Week
                  </Label>
                  <select
                    id="cronDay"
                    value={config.cronDay ?? 1}
                    onChange={(e) => setConfig((c) => ({ ...c, cronDay: Number(e.target.value) }))}
                    className="mt-1.5 flex h-10 w-full rounded-lg border border-outline-ghost/20 bg-background px-3 py-1 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors"
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
                <Label
                  htmlFor="cronStartDate"
                  className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Start Date
                </Label>
                <input
                  id="cronStartDate"
                  type="date"
                  value={config.cronStartDate ?? ""}
                  onChange={(e) => setConfig((c) => ({ ...c, cronStartDate: e.target.value || null }))}
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-outline-ghost/20 bg-background px-3 py-1 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Targeting Parameters (Asymmetric Bento Card layout) */}
      <div className="p-1.5 rounded-[2rem] bg-white/5 ring-1 ring-white/10 dark:ring-white/10">
        <div className="p-6 rounded-[calc(2rem-0.375rem)] bg-card/40 backdrop-blur-md space-y-6">
          <div className="space-y-1">
            <Typography.Small className="text-[10px] uppercase tracking-widest text-secondary font-bold flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-secondary" />
              Targeting Parameters
            </Typography.Small>
            <Typography.H4 className="text-lg font-bold text-foreground">Target Prospect Audience</Typography.H4>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="industries" className="text-xs font-semibold text-foreground">
                Industries
              </Label>
              <Input
                id="industries"
                className="bg-background border-outline-ghost/20 focus-visible:ring-primary"
                value={industries}
                onChange={(e) => setIndustries(e.target.value)}
                placeholder="e.g. accounting, dental, real estate (comma separated)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="locations" className="text-xs font-semibold text-foreground">
                Locations
              </Label>
              <Input
                id="locations"
                className="bg-background border-outline-ghost/20 focus-visible:ring-primary"
                value={locations}
                onChange={(e) => setLocations(e.target.value)}
                placeholder="e.g. Cape Town, Johannesburg (comma separated)"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords" className="text-xs font-semibold text-foreground">
              Keywords
            </Label>
            <Input
              id="keywords"
              className="bg-background border-outline-ghost/20 focus-visible:ring-primary"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. no chatbot, small business, fast growing (comma separated)"
            />
          </div>
        </div>
      </div>

      {/* 3. Outreach Details (Email & Value Prop) */}
      <div className="p-1.5 rounded-[2rem] bg-white/5 ring-1 ring-white/10 dark:ring-white/10">
        <div className="p-6 rounded-[calc(2rem-0.375rem)] bg-card/40 backdrop-blur-md space-y-6">
          <div className="space-y-1">
            <Typography.Small className="text-[10px] uppercase tracking-widest text-accent font-bold flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-accent" />
              Outreach Details
            </Typography.Small>
            <Typography.H4 className="text-lg font-bold text-foreground">Outreach Identity & Proposition</Typography.H4>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromEmail" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Outreach From Email
            </Label>
            <Input
              id="fromEmail"
              type="email"
              className="bg-background border-outline-ghost/20 focus-visible:ring-primary"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="outreach@yourdomain.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valueProposition" className="text-xs font-semibold text-foreground">
              Value Proposition
            </Label>
            <textarea
              id="valueProposition"
              value={valueProposition}
              onChange={(e) => setValueProposition(e.target.value)}
              placeholder="Describe your offer in plain language, e.g. We build custom B2B web applications in under 2 weeks."
              rows={4}
              className="flex w-full rounded-lg border border-outline-ghost/20 bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors resize-none leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Button
        variant="default"
        size="lg"
        className="w-full h-12 bg-primary text-primary-foreground font-bold uppercase tracking-widest shadow-neon-primary hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] text-xs flex items-center justify-center gap-2"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving Configuration...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save Configuration
          </>
        )}
      </Button>
    </div>
  );
}
