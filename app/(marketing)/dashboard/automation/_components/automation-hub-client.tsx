"use client";

import { Bolt } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { ProspectingConfigForm } from "./prospecting-config-form";

export function AutomationHubClient() {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [finding, setFinding] = useState(false);

  async function handleFindProspects() {
    setFinding(true);
    try {
      const res = await fetch("/api/automation/find-prospects", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Find failed");
      setMessage({
        type: "success",
        text: `Found ${data.added} new prospects (${data.duplicates} duplicates skipped).`,
      });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to find prospects." });
    } finally {
      setFinding(false);
    }
  }

  return (
    <>
      {message && (
        <div
          className={`mt-4 rounded-lg p-4 ${
            message.type === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}
        >
          <Typography.Small>{message.text}</Typography.Small>
        </div>
      )}

      <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
        <div className="relative w-8 top-0 right-0 p-4">
          <Bolt />
        </div>
        <div className="flex items-center justify-between mb-8">
          <Typography.H3 className="mt-0 mb-0">Agent Performance Tuning</Typography.H3>
          <Button variant="default" size="sm" onClick={handleFindProspects} disabled={finding}>
            {finding ? "Searching..." : "Find Prospects"}
          </Button>
        </div>
        <ProspectingConfigForm onMessage={setMessage} />
      </div>
    </>
  );
}
