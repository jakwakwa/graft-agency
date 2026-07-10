"use client";

import { Calendar, Check, Loader2, Zap } from "lucide-react";
import { useState } from "react";
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
}

interface AddonOffer {
  priceId: string;
  label: string;
  description: string;
  price: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

export function BillingAddons({
  prices,
  activeAddons,
  pendingAddon,
  isPending,
  onAddAddon,
  voiceAddonAvailable,
}: BillingAddonsProps) {
  const [confirmingAddon, setConfirmingAddon] = useState<AddonOffer | null>(null);

  const addons: AddonOffer[] = [
    {
      priceId: prices.voiceMonthly,
      label: "Voice Agent",
      description: "Answer phone-style enquiries automatically, 24/7",
      price: "$99/mo",
      icon: <Zap className="h-5 w-5 text-violet-500" />,
      comingSoon: !voiceAddonAvailable,
    },
    {
      priceId: prices.bookingMonthly,
      label: "Booking Integration",
      description: "Let your chatbot book appointments directly into your calendar",
      price: "$29/mo",
      icon: <Calendar className="h-5 w-5 text-blue-500" />,
    },
  ].filter((addon) => addon.priceId);

  return (
    <div className="space-y-3">
      <Typography.H3>Add-ons</Typography.H3>
      <Typography.Muted>
        Extend your bot with additional capabilities. Each add-on is billed on top of your subscription and can be
        added once. To cancel an add-on (or your subscription), use Manage Subscription below - all cancellations
        happen in the secure Paddle billing portal, never here.
      </Typography.Muted>
      <div className="grid gap-3 sm:grid-cols-2">
        {addons.map((addon) => {
          const isActive = activeAddons.includes(addon.priceId);
          const loading = pendingAddon === addon.priceId;
          return (
            <Card key={addon.priceId} className={isActive ? "border-gray-900 bg-gray-50" : "hover:border-gray-300"}>
              <CardContent className="p-0">
                <div className="flex w-full items-start justify-between gap-3 p-4 text-left">
                  <span className="flex items-start gap-3">
                    <span className="mt-0.5">{addon.icon}</span>
                    <span>
                      <span className="block text-sm font-semibold">{addon.label}</span>
                      <span className="mt-0.5 block text-xs text-gray-500">{addon.description}</span>
                      <span className="mt-1 block text-xs font-medium text-gray-700">{addon.price}</span>
                      {isActive ? (
                        <span className="mt-1 block text-xs text-gray-500">
                          Active - cancel via Manage Subscription below
                        </span>
                      ) : null}
                    </span>
                  </span>
                  {addon.comingSoon && !isActive ? (
                    <span className="mt-0.5 inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                      Coming soon
                    </span>
                  ) : isActive ? (
                    <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  ) : loading ? (
                    <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      disabled={isPending}
                      onClick={() => setConfirmingAddon(addon)}
                    >
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
                  This adds <strong>{confirmingAddon?.label}</strong> ({confirmingAddon?.price}) to your existing AI
                  Chatbot subscription. It is billed <strong>on top of</strong> your current subscription price,
                  prorated to your next billing period.
                </p>
                <p>
                  An add-on can only be added once. To cancel it later, use the <strong>Manage Subscription</strong>{" "}
                  button on this page - all cancellations and billing changes happen in the secure Paddle billing
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
