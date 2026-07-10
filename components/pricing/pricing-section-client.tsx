"use client";

import { CheckoutEventNames, initializePaddle, type Paddle } from "@paddle/paddle-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Typography } from "@/components/ui/typography"; // used for Muted below
import type { PricingCatalog, PricingMode, PricingOffer } from "@/lib/billing/pricing-catalog";
import { getPreviewItems } from "@/lib/billing/pricing-catalog";
import { BillingCycleToggle } from "./billing-cycle-toggle";
import { PricingCard } from "./pricing-card";

const SYNC_POLL_INTERVAL_MS = 3_000;
const SYNC_POLL_MAX_ATTEMPTS = 20;

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
  /** Price IDs of one-time builds already purchased this calendar month. */
  purchasedBuilds?: string[];
}

export function PricingSectionClient({
  catalogue,
  mode,
  paddleConfig,
  customer,
  kindFilter = "all",
  id = "pricing",
  purchasedBuilds = [],
}: PricingSectionClientProps) {
  const router = useRouter();
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<"monthly" | "annual">("monthly");
  const [localizedPrices, setLocalizedPrices] = useState<Record<string, string>>({});
  // Flips as soon as Paddle reports checkout.completed — locks the subscribe
  // button immediately, before the webhook lands.
  const [justSubscribed, setJustSubscribed] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [localPurchasedBuilds, setLocalPurchasedBuilds] = useState<string[]>([]);
  const [buildError, setBuildError] = useState<string | null>(null);
  const pollAbortRef = useRef(false);
  // Which kind of offer opened the current overlay checkout, so completion
  // events lock the right card.
  const checkoutKindRef = useRef<"subscription" | "one_time" | null>(null);
  const pendingBuildPriceRef = useRef<string | null>(null);

  const subscribed = Boolean(customer?.subscriptionActive) || justSubscribed;
  const canCheckout = mode === "portal" && customer ? !subscribed : false;
  const allPurchasedBuilds = useMemo(
    () => [...new Set([...purchasedBuilds, ...localPurchasedBuilds])],
    [purchasedBuilds, localPurchasedBuilds],
  );

  // Short-poll the uncached status endpoint until the Paddle webhook has
  // synced, then refresh the server-rendered billing state — no hard reload.
  const pollUntilSynced = useCallback(async () => {
    setSyncing(true);
    pollAbortRef.current = false;
    for (let attempt = 0; attempt < SYNC_POLL_MAX_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, SYNC_POLL_INTERVAL_MS));
      if (pollAbortRef.current) return;
      try {
        const res = await fetch("/api/billing/status", { cache: "no-store" });
        if (!res.ok) continue;
        const status = (await res.json()) as { subscriptionActive: boolean };
        if (status.subscriptionActive) break;
      } catch {
        // transient network error — keep polling
      }
    }
    if (!pollAbortRef.current) {
      setSyncing(false);
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    return () => {
      pollAbortRef.current = true;
    };
  }, []);

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
    initializePaddle({
      environment: paddleConfig.environment,
      token: paddleConfig.clientToken,
      eventCallback: (event) => {
        if (event.name !== CheckoutEventNames.CHECKOUT_COMPLETED) return;
        if (checkoutKindRef.current === "one_time") {
          const purchasedPriceId = pendingBuildPriceRef.current;
          if (purchasedPriceId) {
            setLocalPurchasedBuilds((prev) => (prev.includes(purchasedPriceId) ? prev : [...prev, purchasedPriceId]));
          }
          checkoutKindRef.current = null;
          pendingBuildPriceRef.current = null;
          return;
        }
        checkoutKindRef.current = null;
        setJustSubscribed(true);
        void pollUntilSynced();
      },
    }).then((instance) => {
      if (instance) setPaddle(instance);
    });
  }, [paddleConfig.clientToken, paddleConfig.environment, pollUntilSynced]);

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
    // Hard lock: one base subscription per workspace — never reopen checkout
    // once subscribed (or mid-sync after a completed checkout).
    if (subscribed || !paddle || !customer || !price) return;
    checkoutKindRef.current = "subscription";
    paddle.Checkout.open({
      items: [{ priceId: price.priceId, quantity: 1 }],
      customer: { email: customer.email },
      customData: { clientId: customer.clientId },
    });
  };

  const handlePurchaseBuild = async (offer: PricingOffer) => {
    const price = offer.prices.oneTime;
    if (!paddle || !customer || !price || allPurchasedBuilds.includes(price.priceId)) return;
    setBuildError(null);

    // Server-created transaction enforces the one-per-month rule before the
    // overlay ever opens.
    try {
      const res = await fetch("/api/billing/builds/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: price.priceId }),
      });
      const payload = (await res.json()) as { transactionId?: string; error?: string; code?: string };
      if (res.status === 409) {
        setLocalPurchasedBuilds((prev) => (prev.includes(price.priceId) ? prev : [...prev, price.priceId]));
        setBuildError(payload.error ?? "This build has already been purchased this month.");
        return;
      }
      if (!res.ok || !payload.transactionId) {
        setBuildError(payload.error ?? "Unable to start the build checkout. Please try again.");
        return;
      }
      checkoutKindRef.current = "one_time";
      pendingBuildPriceRef.current = price.priceId;
      paddle.Checkout.open({ transactionId: payload.transactionId });
    } catch {
      setBuildError("Unable to start the build checkout. Please try again.");
    }
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
        {mode === "portal" && buildError ? (
          <Typography.Muted className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-red-400">
            {buildError}
          </Typography.Muted>
        ) : null}
        {mode === "portal" && syncing ? (
          <Typography.Muted className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-on-surface-variant">
            Payment received — activating your subscription. This page will update automatically.
          </Typography.Muted>
        ) : null}
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
              mode={mode}
              subscribed={subscribed}
              purchasedBuilds={allPurchasedBuilds}
              onPurchaseBuild={mode === "portal" && customer ? handlePurchaseBuild : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
