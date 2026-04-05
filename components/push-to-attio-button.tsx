"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type State = "idle" | "loading" | "success" | "error";

interface PushWarning {
  step: string;
  severity: "critical" | "minor";
  error: string;
}

interface PushToAttioButtonProps {
  leadId: string;
  initialSynced?: boolean;
}

export function PushToAttioButton({ leadId, initialSynced = false }: PushToAttioButtonProps) {
  const [state, setState] = useState<State>(initialSynced ? "success" : "idle");
  const [wasAlreadySynced, setWasAlreadySynced] = useState(initialSynced);
  const [warnings, setWarnings] = useState<PushWarning[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);

  async function handlePush() {
    setState("loading");
    setErrorText(null);
    setWarnings([]);

    try {
      const res = await fetch(`/api/leads/${leadId}/push-to-attio`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setState("error");
        setErrorText(data.error ?? "Push to Attio failed. Please try again.");
        return;
      }

      setWasAlreadySynced(data.wasAlreadySynced ?? false);
      setWarnings(data.warnings ?? []);
      setState("success");
    } catch {
      setState("error");
      setErrorText("Network error. Please try again.");
    }
  }

  const criticalWarning = warnings.find((w) => w.severity === "critical");

  if (state === "success") {
    const label = wasAlreadySynced ? "Re-synced" : "Synced";
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{label}</Badge>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handlePush}>
            Push again
          </Button>
        </div>
        {criticalWarning && (
          <p className="text-xs text-yellow-700">⚠ {criticalWarning.error}</p>
        )}
      </div>
    );
  }

  if (state === "loading") {
    return (
      <Button variant="outline" size="sm" disabled>
        <Spinner className="mr-1.5 size-3" />
        Pushing…
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button variant="outline" size="sm" onClick={handlePush}>
        Push to Attio
      </Button>
      {state === "error" && errorText && (
        <p className="text-xs text-destructive">{errorText}</p>
      )}
    </div>
  );
}
