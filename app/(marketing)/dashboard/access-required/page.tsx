import Link from "next/link";
import { Typography } from "@/components/ui/typography";
import { ClerkOrgSwitcherPanel } from "./_components/clerk-org-switcher-panel";

export default function AccessRequiredPage() {
  return (
    <div className="mx-auto max-w-lg py-16">
      <Typography.H1>Organisation access required</Typography.H1>
      <Typography.Lead className="mt-3">
        Your account is signed in, but this workspace is not linked to a provisioned organisation in Graft yet.
      </Typography.Lead>
      <Typography.P className="mt-4 text-muted-foreground">
        Select an organisation you belong to, or ask your administrator to invite you and ensure your Clerk organisation
        matches a client record in the system.
      </Typography.P>
      <ClerkOrgSwitcherPanel />
      <Typography.P className="mt-8">
        <Link href="/" className="text-muted-foreground underline-offset-4 hover:underline">
          Back to home
        </Link>
      </Typography.P>
    </div>
  );
}
