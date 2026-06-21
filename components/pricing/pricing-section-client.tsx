"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { useEffect, useMemo, useState } from "react";
import { Typography } from "@/components/ui/typography"; // used for Muted below
import type { PricingCatalog, PricingMode, PricingOffer } from "@/lib/billing/pricing-catalog";
import { getPreviewItems } from "@/lib/billing/pricing-catalog";
import { BillingCycleToggle } from "./billing-cycle-toggle";
import { PricingCard } from "./pricing-card";

export interface PaddleConfig {
  clientToken: string;
  environment: "sandbox" | "production";
}

export interface PricingCustomer {
  clientId: string;
  email: string;
  subscriptionActive: boolean;
}

interface PricingSectionClientProps {
  catalogue: PricingCatalog;
  mode: PricingMode;
  paddleConfig: PaddleConfig;
  customer?: PricingCustomer;
  kindFilter?: "bot" | "website" | "all";
  id?: string;
}

export function PricingSectionClient({
  catalogue,
  mode,
  paddleConfig,
  customer,
  kindFilter = "all",
  id = "pricing",
}: PricingSectionClientProps) {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<"monthly" | "annual">("monthly");
  const [localizedPrices, setLocalizedPrices] = useState<Record<string, string>>({});
  const canCheckout = mode === "portal" && customer ? !customer.subscriptionActive : false;

  const filteredOffers = useMemo(() => {
    return catalogue.offers.filter((offer) => {
      if (kindFilter === "bot") {
        return offer.kind === "subscription" || offer.kind === "addon";
      }
      if (kindFilter === "website") {
        return offer.kind === "one_time";
      }
      return true;
    });
  }, [catalogue.offers, kindFilter]);

  const previewItems = useMemo(() => getPreviewItems({ offers: filteredOffers }), [filteredOffers]);

  useEffect(() => {
    if (!paddleConfig.clientToken) return;
    initializePaddle({ environment: paddleConfig.environment, token: paddleConfig.clientToken }).then((instance) => {
      if (instance) setPaddle(instance);
    });
  }, [paddleConfig.clientToken, paddleConfig.environment]);

  useEffect(() => {
    if (!paddle || previewItems.length === 0) return;
    paddle.PricePreview({ items: previewItems }).then((result) => {
      const nextPrices = Object.fromEntries(
        (result.data?.details?.lineItems ?? []).flatMap((item) => {
          const priceId = item.price?.id;
          const subtotal = item.formattedTotals?.subtotal ?? item.formattedUnitTotals?.subtotal;
          return priceId && subtotal ? [[priceId, subtotal]] : [];
        }),
      );
      setLocalizedPrices(nextPrices);
    });
  }, [paddle, previewItems]);

  const handleCheckout = (offer: PricingOffer) => {
    const price = offer.prices[selectedCycle] ?? offer.prices.oneTime;
    if (!paddle || !customer || !price) return;
    paddle.Checkout.open({
      items: [{ priceId: price.priceId, quantity: 1 }],
      customer: { email: customer.email },
      customData: { clientId: customer.clientId },
    });
  };

  const gridClass =
    kindFilter === "website"
      ? "grid gap-8 md:grid-cols-2 max-w-4xl mx-auto w-full"
      : kindFilter === "bot"
        ? "grid gap-6 md:grid-cols-3 w-full"
        : "grid gap-4 md:grid-cols-2 xl:grid-cols-5 w-full";

  return (
    <section id={id} className="relative z-10 px-4 sm:px-6 py-8 sm:py-12 md:py-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight uppercase text-on-surface leading-tight">
              {kindFilter === "website" ? (
                <>
                  Bespoke Agency{" "}
                  <span className="text-secondary">Design &amp; Builds</span>
                </>
              ) : (
                <>
                  Simple pricing for{" "}
                  <span className="text-primary">always&#8209;on growth</span>
                </>
              )}
            </h2>
            <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
              {kindFilter === "website"
                ? "High-converting, hand-crafted landing pages and multi-page websites with your AI chatbot pre-configured and installed."
                : "Localised Paddle pricing for the chatbot subscription and add-ons."}
            </p>
          </div>
          {kindFilter !== "website" && (
            <BillingCycleToggle selectedCycle={selectedCycle} onSelectCycle={setSelectedCycle} />
          )}
        </div>
        {mode === "portal" && customer?.subscriptionActive ? (
          <Typography.Muted className="rounded-2xl border border-white/10 bg-white/5 p-4 text-on-surface-variant">
            Included in your active subscription
          </Typography.Muted>
        ) : null}
        <div className={gridClass}>
          {filteredOffers.map((offer) => (
            <PricingCard
              key={offer.id}
              offer={offer}
              selectedCycle={selectedCycle}
              localizedPrices={localizedPrices}
              canCheckout={canCheckout}
              onCheckout={handleCheckout}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
