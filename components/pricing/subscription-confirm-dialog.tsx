"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Typography } from "@/components/ui/typography";
import type { PricingOffer, PricingOption } from "@/lib/billing/pricing-catalog";
import { cn } from "@/lib/utils";

type SubscriptionCycle = "monthly" | "annual";

export interface SubscriptionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The subscription offer being confirmed (e.g. the Graft AI Agent base plan). */
  offer: PricingOffer;
  selectedCycle: SubscriptionCycle;
  onSelectCycle: (cycle: SubscriptionCycle) => void;
  /** Localized formatted prices keyed by Paddle price ID (from PricePreview). */
  localizedPrices: Record<string, string>;
  /** Runs the real checkout flow (server transaction + Paddle overlay). */
  onConfirm: () => void;
  /** Disables the CTA while the checkout transaction is being created. */
  pending?: boolean;
}

/**
 * Parse a formatted price string into its currency prefix and numeric value.
 * Handles "$95", "ZAR110", "R1 234,56", "$1,234.50" and similar. Returns null
 * when the value cannot be parsed with confidence.
 */
function parsePrice(formatted?: string): { currency: string; value: number } | null {
  if (!formatted) return null;
  const match = formatted.match(/^\s*([^\d]*?)\s*([\d.,\s]+)\s*$/);
  if (!match) return null;
  const currency = (match[1] ?? "").trim();
  let digits = (match[2] ?? "").replace(/\s/g, "");
  if (!digits) return null;

  // Determine the decimal separator: a trailing ",dd" or ".dd" group (exactly two
  // fractional digits) is treated as decimals; every other separator is a thousands
  // separator and stripped.
  const decimalMatch = digits.match(/[.,](\d{2})$/);
  if (decimalMatch) {
    const sepIndex = digits.length - 3;
    const intPart = digits.slice(0, sepIndex).replace(/[.,]/g, "");
    digits = `${intPart}.${decimalMatch[1] ?? ""}`;
  } else {
    digits = digits.replace(/[.,]/g, "");
  }

  const value = Number.parseFloat(digits);
  if (!Number.isFinite(value)) return null;
  return { currency, value };
}

/**
 * Compute the annual savings versus paying monthly for a year. Returns a formatted
 * string like "R420" / "$240", or null when it cannot be computed reliably (e.g.
 * mismatched currencies or unparseable inputs) so no misleading badge is shown.
 */
export function computeAnnualSavings(monthly?: string, annual?: string): string | null {
  const m = parsePrice(monthly);
  const a = parsePrice(annual);
  if (!m || !a) return null;
  if (m.currency !== a.currency) return null;

  const saved = m.value * 12 - a.value;
  if (saved <= 0) return null;

  const formatted = Number.isInteger(saved) ? String(saved) : saved.toFixed(2);
  return `${m.currency}${formatted}`;
}

function priceLabel(option: PricingOption | undefined, localizedPrices: Record<string, string>): string | null {
  if (!option) return null;
  // Live Paddle price only — no hardcoded fallback. Callers already render
  // nothing when this returns null.
  return localizedPrices[option.priceId] ?? null;
}

export function SubscriptionConfirmDialog({
  open,
  onOpenChange,
  offer,
  selectedCycle,
  onSelectCycle,
  localizedPrices,
  onConfirm,
  pending = false,
}: SubscriptionConfirmDialogProps) {
  const monthly = offer.prices.monthly;
  const annual = offer.prices.annual;

  const monthlyPrice = priceLabel(monthly, localizedPrices);
  const annualPrice = priceLabel(annual, localizedPrices);
  const savings = computeAnnualSavings(monthlyPrice ?? undefined, annualPrice ?? undefined);

  const selectedOption = selectedCycle === "annual" ? (annual ?? monthly) : (monthly ?? annual);
  const selectedPrice = priceLabel(selectedOption, localizedPrices);

  const cycleOptions: Array<{ cycle: SubscriptionCycle; option: PricingOption | undefined; price: string | null }> = [
    { cycle: "monthly", option: monthly, price: monthlyPrice },
    { cycle: "annual", option: annual, price: annualPrice },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-white/10 bg-[#0d0d12]/95 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="pr-8 text-xl font-bold tracking-tight text-on-surface">
            Are you sure you want to subscribe to {offer.title}?
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Plan selection */}
          <div className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="sr-only">Billing cycle</legend>
              {cycleOptions.map(({ cycle, option, price }) =>
                option ? (
                  <label
                    key={cycle}
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                      selectedCycle === cycle
                        ? "border-blue-500/50 bg-blue-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20",
                    )}
                  >
                    <input
                      type="radio"
                      name="billing-cycle"
                      value={cycle}
                      checked={selectedCycle === cycle}
                      onChange={() => onSelectCycle(cycle)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                        selectedCycle === cycle ? "border-blue-400" : "border-white/30",
                      )}
                    >
                      {selectedCycle === cycle ? <span className="h-2 w-2 rounded-full bg-blue-400" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-on-surface">{option.label}</span>
                        {cycle === "annual" && savings ? (
                          <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">
                            Best value — Save {savings}
                          </span>
                        ) : null}
                      </span>
                      {price ? (
                        <span className="mt-1 block text-sm mt-4 text-on-surface-variant">
                          {price}
                          <span className="text-on-surface-variant/70">{option.suffix}</span>
                        </span>
                      ) : null}
                    </span>
                  </label>
                ) : null,
              )}
            </fieldset>

            {selectedPrice ? (
              <div className="flex items-baseline justify-between border-t border-white/10 pt-3">
                <Typography.Small className="text-on-surface-variant">Billed today</Typography.Small>
                <span className="font-display text-lg font-bold text-on-surface">{selectedPrice}</span>
              </div>
            ) : null}
          </div>

          {/* Feature list */}
          <ul className="space-y-3 text-sm mt-4 text-on-surface-variant list-none pl-0">
            {offer.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                <span className="leading-snug">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="w-full rounded-xl bg-blue-500 py-5 text-sm font-semibold uppercase tracking-wider text-white shadow-md shadow-blue-500/10 transition-all hover:bg-blue-400 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100"
          >
            {pending ? "Starting checkout…" : "Continue to payment"}
          </Button>
          <p className="text-xs leading-relaxed text-on-surface-variant/80">
            By continuing you agree to the{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-on-surface">
              Terms of Use
            </Link>{" "}
            and confirm you have read our{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-on-surface">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/refunds" className="underline underline-offset-4 hover:text-on-surface">
              Refund &amp; Cancellation Policy
            </Link>
            .
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
