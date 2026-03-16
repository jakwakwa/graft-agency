import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

export default async function AutomationHubPage() {
  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) return redirectToSignIn();

  return (
    <div className="container max-w-4xl py-8">
      <Typography.H1>Automation</Typography.H1>
      <Typography.Lead className="mt-2">
        Manage your prospect queue and review draft outreach before dispatch.
      </Typography.Lead>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/dashboard/automation/queue">
          <div className="rounded-lg border border-border bg-card p-6 transition-colors hover:bg-muted/50">
            <Typography.H3>Prospect Queue</Typography.H3>
            <Typography.P className="mt-2 text-muted-foreground">
              Add prospects via CSV or single row. View and manage items before processing.
            </Typography.P>
            <Button variant="outline" size="sm" className="mt-4">
              Open Queue
            </Button>
          </div>
        </Link>
        <Link href="/dashboard/automation/leads">
          <div className="rounded-lg border border-border bg-card p-6 transition-colors hover:bg-muted/50">
            <Typography.H3>Draft Leads</Typography.H3>
            <Typography.P className="mt-2 text-muted-foreground">
              Review and approve draft outreach before dispatch.
            </Typography.P>
            <Button variant="outline" size="sm" className="mt-4">
              View Leads
            </Button>
          </div>
        </Link>
      </div>
    </div>
  );
}
