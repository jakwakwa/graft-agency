import { CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

export default function PortalBillingPage() {
  return (
    <div className="w-full max-w-4xl space-y-8 mx-auto p-8">
      <div className="flex flex-col gap-2">
        <Typography.H1>Billing — coming soon</Typography.H1>
        <Typography.Lead>Self-serve billing is on the way. For now, your account is good to go.</Typography.Lead>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="max-w-xs space-y-2">
            <Typography.H3>No action required</Typography.H3>
            <Typography.P className="text-muted-foreground">
              Your account is currently managed manually by Graft Today Agency. You don't need to set up a payment
              method yet.
            </Typography.P>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
