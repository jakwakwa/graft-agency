import { redirect } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { resolveClientIdFromAuth } from "@/lib/auth/resolve-client";

export default async function PortalSettingsPage() {
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) redirect("/sign-in");

  return (
    <section className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <Typography.H1>Settings</Typography.H1>
        <Typography.P className="mt-4 text-muted-foreground">
          This placeholder route confirms the portal segment is wired.
        </Typography.P>
      </div>
    </section>
  );
}
