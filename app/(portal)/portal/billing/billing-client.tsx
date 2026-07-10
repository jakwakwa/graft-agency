"use client";

import { useState, useTransition } from "react";
import type { PaddleConfig } from "@/components/pricing/pricing-section-client";
import { BillingAddons } from "./billing-addons";
import { BillingManagementCard } from "./billing-management-card";
import { BillingStatusCard, type SubscriptionStatus } from "./billing-status-card";

interface BillingClientProps {
  paddleCustomerId: string | null;
  subscriptionStatus: SubscriptionStatus;
  subscriptionActive: boolean;
  subscriptionAddons: string[];
  prices: {
    voiceMonthly: string;
    bookingMonthly: string;
  };
  /** Feature flag — the Voice Agent add-on shows as "Coming soon" when false. */
  voiceAddonAvailable: boolean;
  /** Same Paddle client config the pricing section uses for localized prices. */
  paddleConfig: PaddleConfig;
}

export function BillingClient({
  paddleCustomerId,
  subscriptionStatus,
  subscriptionActive,
  subscriptionAddons,
  prices,
  voiceAddonAvailable,
  paddleConfig,
}: BillingClientProps) {
  const [isPending, startTransition] = useTransition();
  const [addonPending, setAddonPending] = useState<string | null>(null);
  const [localAddons, setLocalAddons] = useState<string[]>(subscriptionAddons);
  const [error, setError] = useState<string | null>(null);

  // Add-only by design: once an add-on is active it can never be removed from
  // our UI — cancellation happens exclusively in the Paddle portal via Manage
  // Subscription, and state resyncs from Paddle webhooks.
  const addAddon = async (priceId: string, label: string) => {
    if (localAddons.includes(priceId)) return;
    setAddonPending(priceId);
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/billing/addons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId }),
        });
        const data = (await res.json()) as { activeAddons?: string[]; error?: string };
        if (res.status === 409 && data.activeAddons) {
          // Already on the live subscription — adopt the server's state.
          setLocalAddons(data.activeAddons);
          return;
        }
        if (!res.ok || !data.activeAddons) throw new Error(data.error ?? "Failed to add add-on");
        setLocalAddons(data.activeAddons);
      } catch {
        setError(`Failed to add ${label}. You have not been charged — please try again.`);
      } finally {
        setAddonPending(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <BillingStatusCard
        paddleCustomerId={paddleCustomerId}
        subscriptionActive={subscriptionActive}
        subscriptionStatus={subscriptionStatus}
      />

      {subscriptionActive && (
        <BillingAddons
          prices={prices}
          activeAddons={localAddons}
          pendingAddon={addonPending}
          isPending={isPending}
          onAddAddon={addAddon}
          voiceAddonAvailable={voiceAddonAvailable}
          paddleConfig={paddleConfig}
        />
      )}

      {paddleCustomerId && <BillingManagementCard />}
    </div>
  );
}
