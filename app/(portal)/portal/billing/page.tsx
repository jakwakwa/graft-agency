import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PricingSection } from "@/components/pricing/pricing-section";
import { Typography } from "@/components/ui/typography";
import prisma from "@/lib/db/prisma";
import { BillingClient } from "./billing-client";

export default async function PortalBillingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const client = await prisma.client.findUnique({
    where: { clerkUserId: userId },
    select: {
      id: true,
      email: true,
      paddleCustomerId: true,
      paddleSubscriptionId: true,
      subscriptionActive: true,
      subscriptionStatus: true,
      subscriptionAddons: true,
    },
  });

  if (!client) redirect("/sign-in");

  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "";
  const environment = process.env.PADDLE_ENVIRONMENT === "production" ? "production" : "sandbox";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 p-8">
      <div className="flex flex-col gap-1">
        <Typography.H1>Billing</Typography.H1>
        <Typography.Lead>Manage your subscription and add-ons.</Typography.Lead>
      </div>

      <BillingClient
        paddleCustomerId={client.paddleCustomerId}
        subscriptionStatus={
          (client.subscriptionStatus as "inactive" | "active" | "paused" | "canceled" | "past_due") ?? "inactive"
        }
        subscriptionActive={client.subscriptionActive}
        subscriptionAddons={client.subscriptionAddons}
        prices={{
          voiceMonthly: process.env.PADDLE_PRICE_VOICE_MONTHLY ?? "",
          bookingMonthly: process.env.PADDLE_PRICE_BOOKING_MONTHLY ?? "",
        }}
      />

      {!client.subscriptionActive && (
        <PricingSection
          mode="portal"
          paddleConfig={{ clientToken, environment }}
          customer={{
            clientId: client.id,
            email: client.email ?? "",
            subscriptionActive: client.subscriptionActive,
          }}
        />
      )}
    </div>
  );
}
