import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Typography } from "@/components/ui/typography";
import { resolveClientIdFromAuth } from "@/lib/auth/resolve-client";

export default async function PortalSettingsPage() {
  const { redirectToSignIn } = await auth();
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) return redirectToSignIn();

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
