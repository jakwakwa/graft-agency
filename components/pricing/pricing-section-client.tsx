"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { useEffect, useMemo, useState } from "react";
import { Typography } from "@/components/ui/typography";
import type { PricingCatalog, PricingMode, PricingOffer } from "@/lib/billing/pricing-catalog";
import { getPreviewItems } from "@/lib/billing/pricing-catalog";
import { BillingCycleToggle } from "./billing-cycle-toggle";
import { PricingCard } from "./pricing-card";

interface PaddleConfig {
  clientToken: string;
  environment: "sandbox" | "production";
}

interface PricingCustomer {
  clientId: string;
  email: string;
  subscriptionActive: boolean;
}

interface PricingSectionClientProps {
  catalogue: PricingCatalog;
  mode: PricingMode;
  paddleConfig: PaddleConfig;
  customer?: PricingCustomer;
}

export function PricingSectionClient({ catalogue, mode, paddleConfig, customer }: PricingSectionClientProps) {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<"monthly" | "annual">("monthly");
  const [localizedPrices, setLocalizedPrices] = useState<Record<string, string>>({});
  const canCheckout = mode === "portal" && customer ? !customer.subscriptionActive : false;
  const previewItems = useMemo(() => getPreviewItems(catalogue), [catalogue]);

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
    const price = offer.prices[selectedCycle];
    if (!paddle || !customer || !price) return;
    paddle.Checkout.open({
      items: [{ priceId: price.priceId, quantity: 1 }],
      customer: { email: customer.email },
      customData: { clientId: customer.clientId },
    });
  };

  return (
    <section id="pricing" className="relative z-10 px-6 py-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2>
              <Typography.H2 className="pb-3 text-on-surface">Simple pricing for always-on growth</Typography.H2>
            </h2>
            <Typography.Lead className="text-on-surface-variant">
              Localised Paddle pricing for the chatbot subscription, add-ons, and website build offers.
            </Typography.Lead>
          </div>
          <BillingCycleToggle selectedCycle={selectedCycle} onSelectCycle={setSelectedCycle} />
        </div>
        {mode === "portal" && customer?.subscriptionActive ? (
          <Typography.Muted className="rounded-2xl border border-white/10 bg-white/5 p-4 text-on-surface-variant">
            Included in your active subscription
          </Typography.Muted>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {catalogue.offers.map((offer) => (
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
