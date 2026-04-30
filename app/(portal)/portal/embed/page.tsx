import { Typography } from "@/components/ui/typography";
import { redirectToAccessRequired, requireAuthOrSignIn } from "@/lib/auth/guards";
import { resolveClientIdFromAuth } from "@/lib/auth/resolve-client";
import { IntegrationGuide } from "./_components/integration-guide";

export default async function PortalEmbedPage() {
  await requireAuthOrSignIn();

  const clientId = await resolveClientIdFromAuth();
  if (!clientId) redirectToAccessRequired();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://graft.today";

  return (
    <div className="w-full max-w-6xl space-y-8 mx-auto p-8">
      <div className="flex flex-col gap-2">
        <Typography.H1>Embed code</Typography.H1>
        <Typography.Lead>
          Seamlessly integrate your white-labelled AI assistant into any website or application. Choose the method that
          best fits your technical stack.
        </Typography.Lead>
      </div>
      <IntegrationGuide clientId={clientId} baseUrl={baseUrl} />
    </div>
  );
}
