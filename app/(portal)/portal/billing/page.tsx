import { Typography } from "@/components/ui/typography";

export default function PortalBillingPage() {
  return (
    <section className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <Typography.H1>Billing</Typography.H1>
        <Typography.P className="mt-4 text-muted-foreground">
          This placeholder route confirms the portal segment is wired.
        </Typography.P>
      </div>
    </section>
  );
}
