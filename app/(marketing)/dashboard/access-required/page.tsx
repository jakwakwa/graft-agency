import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon, Refresh01Icon } from "@hugeicons/core-free-icons";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { DashboardWrapper } from "@/components/layout/dashboard-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui-v2/button";

export default function AccessRequiredPage() {
  return (
    <DashboardWrapper>
      <div className="mx-auto max-w-lg py-20 px-6">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="flex flex-col space-y-2">
            <Typography.H1>Your account isn't activated yet</Typography.H1>
            <Typography.Lead>We've got your sign-in, but your bot hasn't been set up yet.</Typography.Lead>
          </div>

          <Card className="w-full">
            <CardContent className="pt-6 space-y-4">
              <Typography.P className="text-muted-foreground">
                Hold tight — once Graft activates your account, this page will redirect to your bot. If you think this
                is a mistake, drop us a line.
              </Typography.P>

              <div className="flex flex-col gap-3">
                <Button asChild variant="outline" className="w-full">
                  <a href="mailto:support@graft.today" className="flex items-center gap-2">
                    <HugeiconsIcon icon={Mail01Icon} className="h-4 w-4" />
                    Contact support
                  </a>
                </Button>

                <Button asChild variant="ghost" className="w-full">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <HugeiconsIcon icon={Refresh01Icon} className="h-4 w-4" />
                    Try again
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-4 pt-4">
            <Typography.Small className="text-muted-foreground">Signed in as:</Typography.Small>
            <UserButton />
          </div>

          <Typography.P className="mt-8">
            <Link href="/" className="text-muted-foreground text-sm underline-offset-4 hover:underline">
              Back to home
            </Link>
          </Typography.P>
        </div>
      </div>
    </DashboardWrapper>
  );
}
