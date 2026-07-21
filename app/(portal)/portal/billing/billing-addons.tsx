"use-client";

import {
  AiVoiceFreeIcons,
  Calendar01Icon,
  Loading02Icon,
  PlusSignIcon,
  Tick01FreeIcons} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { useEffect, useMemo, useState } from "react";
import type { PaddleConfig } from "@/components/pricing/pricing-section-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

interface BillingAddonsProps {
  prices: {
    voiceMonthly: string;
    bookingMonthly: string;
  };
  activeAddons: string[];
  pendingAddon: string | null;
  isPending: boolean;
  onAddAddon: (priceId: string, label: string) => void;
  /** Feature flag — the Voice Agent add-on shows as "Coming soon" when false. */
  voiceAddonAvailable: boolean;
  /** Same Paddle client config the pricing section uses for localized prices. */
  paddleConfig: PaddleConfig;
}

interface AddonOffer {
  priceId: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
  /** Colour classes for the price value + plus chip, matching the add-on's icon colour. */
  priceText: string;
  priceChip: string;
}

export function BillingAddons({
  prices,
  activeAddons,
  pendingAddon,
  isPending,
  onAddAddon,
  voiceAddonAvailable,
  paddleConfig,
}: BillingAddonsProps) {
  const [confirmingAddon, setConfirmingAddon] = useState<AddonOffer | null>(null);
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [localizedPrices, setLocalizedPrices] = useState<Record<string, string>>({});

  // Same localized-pricing mechanism as the pricing cards: paddle-js
  // PricePreview keyed by price ID. initializePaddle is idempotent — a second
  // call on this page routes to Paddle.Update and, without an eventCallback in
  // its options, leaves the pricing section's checkout callback untouched.
  useEffect(() => {
    if (!paddleConfig.clientToken) return;
    initializePaddle({
      environment: paddleConfig.environment,
      token: paddleConfig.clientToken,
      // Retain needs the Paddle customer ID (ctm_...) — never our internal ID or email.
      ...(paddleConfig.customerId ? { pwCustomer: { id: paddleConfig.customerId } } : {}),
    }).then((instance) => {
      if (instance) setPaddle(instance);
    });
  }, [paddleConfig.clientToken, paddleConfig.environment, paddleConfig.customerId]);

  const previewItems = useMemo(
    () => [prices.voiceMonthly, prices.bookingMonthly].filter(Boolean).map((priceId) => ({ priceId, quantity: 1 })),
    [prices.voiceMonthly, prices.bookingMonthly],
  );

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

  const addons: AddonOffer[] = [
    {
      priceId: prices.voiceMonthly,
      label: "Voice Agent",
      description: "Answer phone-style enquiries automatically, 24/7",
      icon: <HugeiconsIcon icon={AiVoiceFreeIcons} className="h-8 w-8 text-chart-4" />,
      comingSoon: !voiceAddonAvailable,
      priceText: "text-chart-4",
      priceChip: "bg-chart-4/10 text-chart-4 border-chart-4/50 border-1",
    },
    {
      priceId: prices.bookingMonthly,
      label: "Booking Integration",
      description: "Let your chatbot book appointments directly into your calendar",
      icon: <HugeiconsIcon icon={Calendar01Icon} className="h-8 w-8 text-chart-3" />,
      priceText: "text-chart-3",
      priceChip: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    },
  ].filter((addon) => addon.priceId);

  // Live Paddle price only — no hardcoded fallback. Returns undefined until
  // PricePreview resolves (or if it fails), and the price row is then omitted.
  const displayPrice = (addon: AddonOffer): string | undefined => localizedPrices[addon.priceId];

  return (
    <div className="space-y-3">
      <Typography.H3>Add-ons</Typography.H3>
      <Typography.Muted>
        Extend your bot with additional capabilities. Each add-on is billed on top of your subscription and can be added
        once. To cancel an add-on (or your subscription), use Manage Subscription below — all cancellations happen in
        the secure Paddle billing portal, never here.
      </Typography.Muted>
      <div className="grid gap-2 sm:grid-cols-2">
        {addons.map((addon) => {
          const isActive = activeAddons.includes(addon.priceId);
          const loading = pendingAddon === addon.priceId;
          return (
            <Card key={addon.priceId} className={isActive ? "border-gray-200 border-1 bg-gray-50" : "hover:border-gray-200"}>
              <CardContent className="p-0">
                <div className="flex w-full items-start justify-between gap-3 p-4 text-left">
                  <span className="flex items-start gap-4">
                    <span className="mt-0.5">{addon.icon}</span>
                    <span>
                      <span className="block text-sm font-semibold">{addon.label}</span>
                      <span className="mt-0.5 block text-xs font-medium text-gray-300">{addon.description}</span>
                      {displayPrice(addon) ? (
                        <span className="mt-2 flex items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex h-5 w-5 items-center justify-center rounded-md border",
                              addon.priceChip,
                            )}
                          >
                            <HugeiconsIcon icon={PlusSignIcon} className="h-12 w-12" />
                          </span>
                          <span className={cn("text-2xl font-extrabold tracking-wide", addon.priceText)}>
                            {displayPrice(addon)}
                          </span>
                          <span className="self-end pb-0.5 text-[11px] font-medium text-gray-300">/mo</span>
                        </span>
                      ) : null}
                      {isActive ? (
                        <span className="mt-1 block text-[11.5px] w-full font-light italic text-gray-400">
                          Cancel via Manage Subscription
                        </span>
                      ) : null}
                    </span>
                  </span>
                  {addon.comingSoon && !isActive ? (
                    <span className="mt-0.5 inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                      Coming soon
                    </span>
                  ) : isActive ? (
                    <span className="absolute top-4 right-8 mt-0.5 inline-flex flex-row-reverse items-center gap-1 rounded-full bg-teal-900 shadow-xs shadow-teal-500/40 outline-teal-500/40 outline-1 px-2 py-[1px] text-[10px] font-medium text-emerald-200">
                      <HugeiconsIcon icon={Tick01FreeIcons} stroke={"4px"} className="h-4 w-4 outline-0 text-emerald-300" /> Active
                    </span>
                  ) : loading ? (
                    <HugeiconsIcon icon={Loading02Icon} className="mt-0.5 h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    <Button type="button" size="sm" disabled={isPending} onClick={() => setConfirmingAddon(addon)}>
                      Add
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={confirmingAddon !== null} onOpenChange={(open) => !open && setConfirmingAddon(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add {confirmingAddon?.label}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  This adds <strong>{confirmingAddon?.label}</strong>
                  {confirmingAddon && displayPrice(confirmingAddon) ? ` (${displayPrice(confirmingAddon)}/mo)` : ""} to
                  your existing AI Chatbot subscription. It is billed <strong>on top of</strong> your current
                  subscription price, prorated to your next billing period.
                </p>
                <p>
                  An add-on can only be added once. To cancel it later, use the <strong>Manage Subscription</strong>{" "}
                  button on this page — all cancellations and billing changes happen in the secure Paddle billing
                  portal, not in this app.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmingAddon) onAddAddon(confirmingAddon.priceId, confirmingAddon.label);
                setConfirmingAddon(null);
              }}
            >
              Add {confirmingAddon?.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
