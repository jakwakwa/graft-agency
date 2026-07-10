import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import type { BillingCycle, PricingOffer } from "@/lib/billing/pricing-catalog";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  offer: PricingOffer;
  selectedCycle: Extract<BillingCycle, "monthly" | "annual">;
  localizedPrices: Record<string, string>;
  canCheckout: boolean;
  onCheckout: (offer: PricingOffer) => void;
  /** "portal" enables subscription-state-aware buttons; "landing" keeps marketing links. */
  mode?: "landing" | "portal";
  /** Whether the workspace's base AI Chatbot subscription is (or just became) active. */
  subscribed?: boolean;
  /** Price IDs of one-time builds already purchased by this workspace this month. */
  purchasedBuilds?: string[];
  /** Opens a server-validated one-time build checkout (portal mode only). */
  onPurchaseBuild?: (offer: PricingOffer) => void;
}

interface CardTheme {
  borderHover: string;
  shadowHover: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  checkText: string;
  btnPrimary: string;
  btnOutline: string;
  defaultBadge: string;
}

const THEMES: Record<string, CardTheme> = {
  "ai-chatbot": {
    borderHover: "hover:border-blue-500/40",
    shadowHover: "hover:shadow-blue-500/5",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-400",
    badgeBorder: "border-blue-500/20",
    checkText: "text-blue-400",
    btnPrimary: "bg-blue-500 text-white hover:bg-blue-400 shadow-md shadow-blue-500/10",
    btnOutline:
      "bg-transparent text-on-surface border-white/10 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400",
    defaultBadge: "Core Subscription",
  },
  "voice-agent": {
    borderHover: "hover:border-cyan-500/40",
    shadowHover: "hover:shadow-cyan-500/5",
    badgeBg: "bg-cyan-500/10",
    badgeText: "text-cyan-400",
    badgeBorder: "border-cyan-500/20",
    checkText: "text-cyan-400",
    btnPrimary: "bg-cyan-500 text-black hover:bg-cyan-400 shadow-md shadow-cyan-500/10",
    btnOutline:
      "bg-transparent text-on-surface border-white/10 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-400",
    defaultBadge: "Voice Add-on",
  },
  "booking-integration": {
    borderHover: "hover:border-emerald-500/40",
    shadowHover: "hover:shadow-emerald-500/5",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-400",
    badgeBorder: "border-emerald-500/20",
    checkText: "text-emerald-400",
    btnPrimary: "bg-emerald-500 text-black hover:bg-emerald-400 shadow-md shadow-emerald-500/10",
    btnOutline:
      "bg-transparent text-on-surface border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400",
    defaultBadge: "Booking Add-on",
  },
  "landing-page-build": {
    borderHover: "hover:border-amber-500/40",
    shadowHover: "hover:shadow-amber-500/5",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-400",
    badgeBorder: "border-amber-500/20",
    checkText: "text-amber-400",
    btnPrimary: "bg-amber-500 text-black hover:bg-amber-400 shadow-md shadow-amber-500/10",
    btnOutline:
      "bg-transparent text-on-surface border-white/10 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400",
    defaultBadge: "Single Page Build",
  },
  "small-business-website-build": {
    borderHover: "hover:border-rose-500/40",
    shadowHover: "hover:shadow-rose-500/5",
    badgeBg: "bg-rose-500/10",
    badgeText: "text-rose-400",
    badgeBorder: "border-rose-500/20",
    checkText: "text-rose-400",
    btnPrimary: "bg-rose-500 text-white hover:bg-rose-400 shadow-md shadow-rose-500/10",
    btnOutline:
      "bg-transparent text-on-surface border-white/10 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400",
    defaultBadge: "Multi-Page Build",
  },
};

const DEFAULT_THEME = THEMES["ai-chatbot"]!;

export function PricingCard({
  offer,
  selectedCycle,
  localizedPrices,
  canCheckout,
  onCheckout,
  mode = "landing",
  subscribed = false,
  purchasedBuilds = [],
  onPurchaseBuild,
}: PricingCardProps) {
  const price = offer.prices[selectedCycle] ?? offer.prices.oneTime ?? offer.prices.monthly ?? offer.prices.annual;
  const displayPrice = price ? (localizedPrices[price.priceId] ?? price.fallbackPrice) : "Contact us";
  const isSubscription = offer.kind === "subscription";
  const isAddon = offer.kind === "addon";
  const isOneTime = offer.kind === "one_time";
  const action = getActionLabel({ canCheckout, isSubscription });

  // Base subscription lock: max one per workspace — no repeat checkouts.
  const baseLocked = mode === "portal" && isSubscription && subscribed;
  // Add-on prerequisite gate: disabled until the base subscription is active.
  const addonGated = mode === "portal" && isAddon;
  // One-time build purchase state: max one per workspace per calendar month.
  const buildPurchasable = mode === "portal" && isOneTime && Boolean(onPurchaseBuild) && Boolean(price);
  const buildPurchased = buildPurchasable && price ? purchasedBuilds.includes(price.priceId) : false;

  const theme = THEMES[offer.id] ?? DEFAULT_THEME;
  // Feature-flagged offers (e.g. Voice Agent) render disabled in every mode.
  const comingSoon = Boolean(offer.comingSoon);

  return (
    <article
      className={cn(
        "glass-panel flex h-full flex-col gap-6 rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl border-white/10 bg-[#0d0d12]/50 hover:bg-[#0d0d12]/80",
        theme.borderHover,
        theme.shadowHover,
      )}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border uppercase tracking-wider",
              theme.badgeBg,
              theme.badgeText,
              theme.badgeBorder,
            )}
          >
            {offer.badge ?? theme.defaultBadge}
          </span>
        </div>
        <div>
          <h3>
            <Typography.H3 className="m-0 text-xl font-bold text-on-surface tracking-tight">
              {offer.title}
            </Typography.H3>
          </h3>
          <Typography.Muted className="mt-2 text-sm text-on-surface-variant leading-relaxed">
            {offer.description}
          </Typography.Muted>
        </div>
      </div>

      <div className="flex items-baseline gap-1 py-2">
        <span className="font-display text-4xl font-extrabold tracking-tight text-on-surface">{displayPrice}</span>
        {price ? <span className="ml-1 text-sm font-medium text-on-surface-variant">{price.suffix}</span> : null}
      </div>

      <ul className="my-0 space-y-3 text-sm text-on-surface-variant list-none pl-0">
        {offer.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check className={cn("h-4 w-4 shrink-0 mt-0.5", theme.checkText)} />
            <span className="leading-snug text-on-surface-variant">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-4">
        {comingSoon ? (
          <Button
            type="button"
            disabled
            aria-disabled
            title="This add-on is coming soon and cannot be activated yet"
            className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 py-5 text-sm font-semibold uppercase tracking-wider text-on-surface-variant opacity-70"
          >
            Coming soon
          </Button>
        ) : baseLocked ? (
          <Button
            type="button"
            disabled
            aria-disabled
            title="One subscription per workspace — cancel or change it via Manage Subscription"
            className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 py-5 text-sm font-semibold uppercase tracking-wider text-on-surface-variant opacity-70"
          >
            You&rsquo;re already subscribed
          </Button>
        ) : canCheckout && isSubscription ? (
          <Button
            type="button"
            onClick={() => onCheckout(offer)}
            className={cn(
              "w-full rounded-xl py-5 font-semibold text-sm tracking-wider uppercase hover:scale-[1.01] active:scale-[0.99] transition-all",
              theme.btnPrimary,
            )}
          >
            Subscribe to AI Chatbot
          </Button>
        ) : buildPurchased ? (
          <Button
            type="button"
            disabled
            aria-disabled
            title="One build of each type per workspace per month"
            className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 py-5 text-sm font-semibold uppercase tracking-wider text-on-surface-variant opacity-70"
          >
            Purchased this month
          </Button>
        ) : buildPurchasable ? (
          <Button
            type="button"
            onClick={() => onPurchaseBuild?.(offer)}
            className={cn(
              "w-full rounded-xl py-5 font-semibold text-sm tracking-wider uppercase hover:scale-[1.01] active:scale-[0.99] transition-all",
              theme.btnPrimary,
            )}
          >
            Purchase build
          </Button>
        ) : addonGated ? (
          <Button
            type="button"
            disabled
            aria-disabled
            title={
              subscribed
                ? "Add this add-on from the Add-ons section above — cancel anytime via Manage Subscription"
                : "Requires an active AI Chatbot subscription"
            }
            className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 py-5 text-sm font-semibold uppercase tracking-wider text-on-surface-variant opacity-70"
          >
            {subscribed ? "Manage in Add-ons" : "Requires AI Chatbot subscription"}
          </Button>
        ) : (
          <Link
            href="/portal/billing"
            className={cn(
              "inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] border uppercase tracking-wider",
              theme.btnOutline,
            )}
          >
            {action}
          </Link>
        )}
      </div>
    </article>
  );
}

function getActionLabel(params: { canCheckout: boolean; isSubscription: boolean }) {
  if (!params.isSubscription) return "View details";
  if (!params.canCheckout) return "View portal billing";
  return "View portal billing";
}
