import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { AutomationWrapper } from "@/components/layout/automation-wrapper";
import { DashboardWrapper } from "@/components/layout/dashboard-wrapper";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

interface AccessDeniedProps {
  error: string;
}

export function AccessDenied({ error }: AccessDeniedProps) {
  return (
    <DashboardWrapper>
      <AutomationWrapper>
        <MarketingShell>
          <div className="w-full max-w-6xl p-8 mx-auto flex flex-col items-center justify-center min-h-[50dvh]">
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 max-w-md text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <Typography.H3 className="mt-0 text-foreground">Access Denied</Typography.H3>
              <Typography.P className="text-sm text-muted-foreground leading-relaxed">{error}</Typography.P>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full mt-2">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </MarketingShell>
      </AutomationWrapper>
    </DashboardWrapper>
  );
}
