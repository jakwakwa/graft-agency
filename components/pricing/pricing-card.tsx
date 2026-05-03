import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import type { BillingCycle, PricingOffer } from "@/lib/billing/pricing-catalog";

interface PricingCardProps {
  offer: PricingOffer;
  selectedCycle: Extract<BillingCycle, "monthly" | "annual">;
  localizedPrices: Record<string, string>;
  canCheckout: boolean;
  onCheckout: (offer: PricingOffer) => void;
}

export function PricingCard({ offer, selectedCycle, localizedPrices, canCheckout, onCheckout }: PricingCardProps) {
  const price = offer.prices[selectedCycle] ?? offer.prices.oneTime ?? offer.prices.monthly ?? offer.prices.annual;
  const displayPrice = price ? (localizedPrices[price.priceId] ?? price.fallbackPrice) : "Contact us";
  const isSubscription = offer.kind === "subscription";
  const action = getActionLabel({ canCheckout, isSubscription });

  return (
    <article className="glass-panel flex h-full flex-col gap-5 rounded-3xl border border-white/10 p-6">
      <div className="space-y-3">
        {offer.badge ? <Typography.Small className="text-primary">{offer.badge}</Typography.Small> : null}
        <h3>
          <Typography.H3 className="m-0 text-xl text-on-surface">{offer.title}</Typography.H3>
        </h3>
        <Typography.Muted className="text-on-surface-variant">{offer.description}</Typography.Muted>
      </div>
      <div>
        <span className="font-display text-4xl font-semibold tracking-tight text-on-surface">{displayPrice}</span>
        {price ? <Typography.Small className="ml-2 text-on-surface-variant">{price.suffix}</Typography.Small> : null}
      </div>
      <Typography.List className="my-0 ms-5 text-sm text-on-surface-variant">
        {offer.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </Typography.List>
      <div className="mt-auto">
        {canCheckout && isSubscription ? (
          <Button type="button" onClick={() => onCheckout(offer)} className="w-full">
            Subscribe to AI Chatbot
          </Button>
        ) : (
          <Link
            href="/portal/billing"
            className="inline-flex w-full items-center justify-center rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-white/10"
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
