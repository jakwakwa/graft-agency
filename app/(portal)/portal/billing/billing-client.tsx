"use client";

import { useState, useTransition } from "react";
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
}

export function BillingClient({
  paddleCustomerId,
  subscriptionStatus,
  subscriptionActive,
  subscriptionAddons,
  prices,
}: BillingClientProps) {
  const [isPending, startTransition] = useTransition();
  const [addonPending, setAddonPending] = useState<string | null>(null);
  const [localAddons, setLocalAddons] = useState<string[]>(subscriptionAddons);
  const [error, setError] = useState<string | null>(null);

  const toggleAddon = async (priceId: string, label: string) => {
    const isActive = localAddons.includes(priceId);
    setAddonPending(priceId);
    setError(null);
    const next = isActive ? localAddons.filter((id) => id !== priceId) : [...localAddons, priceId];
    setLocalAddons(next);

    startTransition(async () => {
      try {
        const res = await fetch("/api/billing/addons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId, action: isActive ? "remove" : "add" }),
        });
        if (!res.ok) throw new Error("Failed to update add-on");
        const data = (await res.json()) as { activeAddons: string[] };
        setLocalAddons(data.activeAddons);
      } catch {
        setLocalAddons(localAddons); // revert on failure
        setError(`Failed to update ${label}. Please try again.`);
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
          onToggleAddon={toggleAddon}
        />
      )}

      {paddleCustomerId && <BillingManagementCard />}
    </div>
  );
}
