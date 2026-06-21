"use client";

import { Bolt } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui-v2/button";
import { ProspectingConfigForm } from "./prospecting-config-form";

const AUTOMATION_TOAST = { duration: Infinity, closeButton: true } as const;

export function AutomationHubClient() {
  const [finding, setFinding] = useState(false);

  async function handleFindProspects() {
    setFinding(true);
    try {
      const res = await fetch("/api/automation/find-prospects", { method: "POST" });
      const data: {
        error?: string;
        added?: number;
        duplicates?: number;
        errors?: number;
        rejected?: number;
      } = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Find failed");
      const added = data.added ?? 0;
      const duplicates = data.duplicates ?? 0;
      const errors = data.errors ?? 0;
      const rejected = data.rejected ?? 0;

      let msg = `Found ${added} new prospects.`;
      if (duplicates > 0 || rejected > 0) {
        const parts = [];
        if (duplicates > 0) parts.push(`${duplicates} duplicates`);
        if (rejected > 0) parts.push(`${rejected} hallucinations`);
        msg += ` (${parts.join(", ")} skipped).`;
      }

      toast.success(msg, {
        ...AUTOMATION_TOAST,
        description: errors > 0 ? `${errors} row(s) failed to save.` : undefined,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to find prospects.", AUTOMATION_TOAST);
    } finally {
      setFinding(false);
    }
  }

  return (
    <div className="p-1.5 rounded-[2.5rem] ring-1 ring-white/10 dark:ring-white/10 shadow-xl">
      <div className="p-8 rounded-[calc(2.5rem-0.375rem)] bg-card/50 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-neon">
              <Bolt className="h-5 w-5 animate-[spin_8s_linear_infinite]" />
            </div>
            <div>
              <Typography.H3 className="mt-0 mb-0 text-xl font-bold text-foreground">
                Agent Performance Tuning
              </Typography.H3>
              <Typography.Muted className="text-xs text-muted-foreground mt-0.5 block">
                Calibrate scraping schedule, criteria, and target value propositions
              </Typography.Muted>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFindProspects}
            disabled={finding}
            className="h-10 px-5 bg-foreground text-background hover:bg-foreground/90 font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition-all duration-300"
          >
            {finding ? "Searching..." : "Find Prospects"}
          </Button>
        </div>
        <ProspectingConfigForm />
      </div>
    </div>
  );
}
