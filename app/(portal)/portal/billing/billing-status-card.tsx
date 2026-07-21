import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

export type SubscriptionStatus = "inactive" | "active" | "paused" | "canceled" | "past_due";

interface BillingStatusCardProps {
  paddleCustomerId: string | null;
  subscriptionActive: boolean;
  subscriptionStatus: SubscriptionStatus;
}

const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; color: string }> = {
  inactive: {
    label: "No subscription",
    color: "bg-gray-950 text-gray-100 border-2 border-gray-700 shadow-black shadow-sm min-w-30",
  },
  active: { label: "Subscribed", color: "bg-emerald-800 text-emerald-100" },
  paused: { label: "Paused", color: "bg-yellow-100 text-yellow-700" },
  canceled: { label: "Cancelled", color: "bg-red-100 text-red-600" },
  past_due: { label: "Payment issue", color: "bg-red-100 text-red-700" },
};

export function BillingStatusCard({
  paddleCustomerId,
  subscriptionActive,
  subscriptionStatus,
}: BillingStatusCardProps) {
  const status = STATUS_CONFIG[subscriptionStatus] ?? STATUS_CONFIG.inactive;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Graft AI Agent Subscription</CardTitle>
           
          </div>
          <Badge variant={"outline"} className={`rounded-full px-2 py-1 text-[10px] font-light`}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {subscriptionStatus === "past_due" && paddleCustomerId ? (
          <div className="space-y-3">
            <Typography.Muted className="text-red-600">
              Your last payment failed. Update your payment method to keep your bot running.
            </Typography.Muted>
            <a href="/api/billing/portal">
              <Button variant="destructive" className="w-full">
                Update Payment Method
              </Button>
            </a>
          </div>
        ) : null}
        {subscriptionStatus === "paused" && paddleCustomerId ? (
          <Typography.Muted className="text-yellow-700">
            Your subscription is paused. Visit billing management to resume.
          </Typography.Muted>
        ) : null}
        {subscriptionActive ? (
          <Typography.Muted>Manage payment details and invoices below.</Typography.Muted>
        ) : null}
        {!subscriptionActive && subscriptionStatus !== "paused" && subscriptionStatus !== "past_due" ? (
          <Typography.Muted>Choose a chatbot plan in the pricing section below to activate your bot.</Typography.Muted>
        ) : null}
      </CardContent>
    </Card>
  );
}
