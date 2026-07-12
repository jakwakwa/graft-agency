"use client";

import type { BillingCycle } from "@/lib/billing/pricing-catalog";
import { cn } from "@/lib/utils";

interface BillingCycleToggleProps {
  selectedCycle: Extract<BillingCycle, "monthly" | "annual">;
  onSelectCycle: (cycle: Extract<BillingCycle, "monthly" | "annual">) => void;
}

export function BillingCycleToggle({ selectedCycle, onSelectCycle }: BillingCycleToggleProps) {
  return (
    <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
      {(["monthly", "annual"] as const).map((cycle) => (
        <button
          key={cycle}
          type="button"
          onClick={() => onSelectCycle(cycle)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            selectedCycle === cycle ? "bg-emerald-400 text-emerald-800 shadow-teal-950 border-1 border-emerald-300 shadow-md" : "text-on-surface-variant hover:text-on-surface",
          )}
        >
          {cycle === "monthly" ? "Monthly" : "Annual"}
        </button>
      ))}
    </div>
  );
}
