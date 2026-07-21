import { HugeiconsIcon } from "@hugeicons/react";
import { CreditCardIcon, LinkSquare01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function BillingManagementCard() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <HugeiconsIcon icon={CreditCardIcon} className="h-5 w-5 text-gray-400" />
          <div>
            <div className="text-sm font-medium">Payment Method &amp; Invoices</div>
            <div className="text-xs text-gray-500">Update your card, download invoices, view billing history</div>
          </div>
        </div>
        <a href="/api/billing/portal" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-1.5">
            Manage <HugeiconsIcon icon={LinkSquare01Icon} className="h-3.5 w-3.5" />
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}
