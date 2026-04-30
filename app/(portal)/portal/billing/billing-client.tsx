"use client";

import { useEffect, useState, useTransition } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { CreditCard, ExternalLink, Loader2, Zap, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

type SubscriptionStatus = "inactive" | "active" | "paused" | "canceled" | "past_due";

interface BillingClientProps {
  clientId: string;
  email: string;
  paddleCustomerId: string | null;
  subscriptionStatus: SubscriptionStatus;
  subscriptionActive: boolean;
  subscriptionAddons: string[];
  prices: {
    chatbotMonthly: string;
    chatbotAnnual: string;
    voiceMonthly: string;
    bookingMonthly: string;
  };
  environment: "sandbox" | "production";
  clientToken: string;
}

const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; color: string }> = {
  inactive: { label: "No subscription", color: "bg-gray-100 text-gray-600" },
  active: { label: "Active", color: "bg-green-100 text-green-700" },
  paused: { label: "Paused", color: "bg-yellow-100 text-yellow-700" },
  canceled: { label: "Canceled", color: "bg-red-100 text-red-600" },
  past_due: { label: "Payment issue", color: "bg-red-100 text-red-700" },
};

export function BillingClient({
  clientId,
  email,
  paddleCustomerId,
  subscriptionStatus,
  subscriptionActive,
  subscriptionAddons,
  prices,
  environment,
  clientToken,
}: BillingClientProps) {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("monthly");
  const [isPending, startTransition] = useTransition();
  const [addonPending, setAddonPending] = useState<string | null>(null);
  const [localAddons, setLocalAddons] = useState<string[]>(subscriptionAddons);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializePaddle({
      environment,
      token: clientToken,
      eventCallback: (event) => {
        if (event.name === "checkout.completed") {
          window.location.reload();
        }
      },
    }).then((instance) => {
      if (instance) setPaddle(instance);
    });
  }, [environment, clientToken]);

  const handleSubscribe = () => {
    const priceId = selectedPlan === "annual" ? prices.chatbotAnnual : prices.chatbotMonthly;
    paddle?.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email },
      customData: { clientId },
    });
  };

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

  const status = STATUS_CONFIG[subscriptionStatus] ?? STATUS_CONFIG.inactive;

  const addons = [
    {
      priceId: prices.voiceMonthly,
      label: "Voice Agent",
      description: "Answer phone-style enquiries automatically, 24/7",
      price: "£37/mo",
      icon: <Zap className="w-5 h-5 text-violet-500" />,
    },
    {
      priceId: prices.bookingMonthly,
      label: "Booking Integration",
      description: "Let your chatbot book appointments directly into your calendar",
      price: "£27/mo",
      icon: <Calendar className="w-5 h-5 text-blue-500" />,
    },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Subscription status card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Chatbot Subscription</CardTitle>
              <CardDescription>Your bot, embedded on your website, always on</CardDescription>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>{status.label}</span>
          </div>
        </CardHeader>
        <CardContent>
          {!subscriptionActive && subscriptionStatus !== "paused" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPlan("monthly")}
                  className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                    selectedPlan === "monthly"
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div>Monthly</div>
                  <div className={`text-xs mt-0.5 ${selectedPlan === "monthly" ? "text-gray-300" : "text-gray-500"}`}>
                    £147/month
                  </div>
                </button>
                <button
                  onClick={() => setSelectedPlan("annual")}
                  className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                    selectedPlan === "annual"
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    Annual
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${selectedPlan === "annual" ? "bg-green-500 text-white" : "bg-green-100 text-green-700"}`}
                    >
                      Save 17%
                    </span>
                  </div>
                  <div className={`text-xs mt-0.5 ${selectedPlan === "annual" ? "text-gray-300" : "text-gray-500"}`}>
                    £1,470/year
                  </div>
                </button>
              </div>
              <Button onClick={handleSubscribe} disabled={!paddle} className="w-full">
                {paddle ? "Subscribe Now" : <Loader2 className="w-4 h-4 animate-spin" />}
              </Button>
            </div>
          )}

          {subscriptionStatus === "past_due" && paddleCustomerId && (
            <div className="space-y-3">
              <p className="text-sm text-red-600">
                Your last payment failed. Update your payment method to keep your bot running.
              </p>
              <a href="/api/billing/portal">
                <Button variant="destructive" className="w-full">
                  Update Payment Method
                </Button>
              </a>
            </div>
          )}

          {subscriptionStatus === "paused" && paddleCustomerId && (
            <p className="text-sm text-yellow-700">
              Your subscription is paused. Visit billing management to resume.
            </p>
          )}

          {subscriptionActive && (
            <p className="text-sm text-gray-500">
              Your bot is active. Manage payment details and invoices via the billing portal below.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add-ons — only show when subscribed */}
      {subscriptionActive && (
        <div className="space-y-3">
          <Typography.H3>Add-ons</Typography.H3>
          <p className="text-sm text-gray-500">Extend your bot with additional capabilities. Toggle on or off at any time.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {addons.map((addon) => {
              const isActive = localAddons.includes(addon.priceId);
              const loading = addonPending === addon.priceId;
              return (
                <Card
                  key={addon.priceId}
                  className={`cursor-pointer transition-colors ${isActive ? "border-gray-900 bg-gray-50" : "hover:border-gray-300"}`}
                  onClick={() => !loading && !isPending && toggleAddon(addon.priceId, addon.label)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{addon.icon}</div>
                        <div>
                          <div className="text-sm font-semibold">{addon.label}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{addon.description}</div>
                          <div className="text-xs font-medium text-gray-700 mt-1">{addon.price}</div>
                        </div>
                      </div>
                      <div className="mt-0.5">
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : (
                          <div
                            className={`w-9 h-5 rounded-full transition-colors ${isActive ? "bg-gray-900" : "bg-gray-200"} relative`}
                          >
                            <div
                              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-4" : "translate-x-0.5"}`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Billing management link */}
      {paddleCustomerId && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm font-medium">Payment Method &amp; Invoices</div>
                <div className="text-xs text-gray-500">Update your card, download invoices, view billing history</div>
              </div>
            </div>
            <a href="/api/billing/portal" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5">
                Manage <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
