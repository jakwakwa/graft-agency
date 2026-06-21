"use client";

import { Bolt } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
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
    <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
      <div className="relative w-8 top-0 right-0 p-4">
        <Bolt />
      </div>
      <div className="flex items-center justify-between mb-8">
        <Typography.H3 className="mt-0 mb-0">Agent Performance Tuning</Typography.H3>
        <Button variant="secondary" size="lg" onClick={handleFindProspects} disabled={finding}>
          {finding ? "Searching..." : "Find Prospects"}
        </Button>
      </div>
      <ProspectingConfigForm />
    </div>
  );
}
