"use client";

import type { BillingCycle } from "@/lib/billing/pricing-catalog";
import { cn } from "@/lib/utils";

interface BillingCycleToggleProps {
  selectedCycle: Extract<BillingCycle, "monthly" | "annual">;
  onSelectCycle: (cycle: Extract<BillingCycle, "monthly" | "annual">) => void;
}

export function BillingCycleToggle({ selectedCycle, onSelectCycle }: BillingCycleToggleProps) {
  return (
    <div className="inline-flex rounded-full mx-auto w-1/3 sm:1/3 md:w-1/4 lg:w-fit   md:mx-0 border border-white/10 bg-white/10 p-1">
      {(["monthly", "annual"] as const).map((cycle) => (
        <button
          key={cycle}
          type="button"
          onClick={() => onSelectCycle(cycle)}
          className={cn(
            "rounded-full px-4 py-2 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            selectedCycle === cycle
              ? "bg-primary text-blue-200 shadow-indigo-950 border-1 border-blue-400 text-shadow-md font-bold tracking-wide shadow-md shadow-black"
              : "text-on-surface-variant hover:text-on-surface",
          )}
        >
          {cycle === "monthly" ? "Monthly" : "Annual"}
        </button>
      ))}
    </div>
  );
}
