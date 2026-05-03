import { Calendar, Loader2, Zap } from "lucide-react";
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
  onToggleAddon: (priceId: string, label: string) => void;
}

export function BillingAddons({ prices, activeAddons, pendingAddon, isPending, onToggleAddon }: BillingAddonsProps) {
  const addons = [
    {
      priceId: prices.voiceMonthly,
      label: "Voice Agent",
      description: "Answer phone-style enquiries automatically, 24/7",
      price: "£37/mo",
      icon: <Zap className="h-5 w-5 text-violet-500" />,
    },
    {
      priceId: prices.bookingMonthly,
      label: "Booking Integration",
      description: "Let your chatbot book appointments directly into your calendar",
      price: "£27/mo",
      icon: <Calendar className="h-5 w-5 text-blue-500" />,
    },
  ].filter((addon) => addon.priceId);

  return (
    <div className="space-y-3">
      <Typography.H3>Add-ons</Typography.H3>
      <Typography.Muted>Extend your bot with additional capabilities. Toggle on or off at any time.</Typography.Muted>
      <div className="grid gap-3 sm:grid-cols-2">
        {addons.map((addon) => {
          const isActive = activeAddons.includes(addon.priceId);
          const loading = pendingAddon === addon.priceId;
          return (
            <Card key={addon.priceId} className={isActive ? "border-gray-900 bg-gray-50" : "hover:border-gray-300"}>
              <CardContent className="p-0">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 p-4 text-left"
                  disabled={loading || isPending}
                  onClick={() => onToggleAddon(addon.priceId, addon.label)}
                >
                  <span className="flex items-start gap-3">
                    <span className="mt-0.5">{addon.icon}</span>
                    <span>
                      <span className="block text-sm font-semibold">{addon.label}</span>
                      <span className="mt-0.5 block text-xs text-gray-500">{addon.description}</span>
                      <span className="mt-1 block text-xs font-medium text-gray-700">{addon.price}</span>
                    </span>
                  </span>
                  <AddonToggle loading={loading} isActive={isActive} />
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function AddonToggle({ loading, isActive }: { loading: boolean; isActive: boolean }) {
  if (loading) return <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-gray-400" />;
  return (
    <span
      className={`relative mt-0.5 h-5 w-9 rounded-full transition-colors ${isActive ? "bg-gray-900" : "bg-gray-200"}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-4" : "translate-x-0.5"}`}
      />
    </span>
  );
}
