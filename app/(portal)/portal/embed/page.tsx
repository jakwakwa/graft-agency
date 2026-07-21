import { SubscriptionGate } from "@/components/portal/subscription-gate";
import { Typography } from "@/components/ui/typography";
import { redirectToAccessRequired, requireAuthOrSignIn } from "@/lib/auth/guards";
import { resolveClientIdFromAuth } from "@/lib/auth/resolve-client";
import { getClientEntitlements } from "@/lib/billing/entitlements";
import { IntegrationGuide } from "./_components/integration-guide";

export default async function PortalEmbedPage() {
  await requireAuthOrSignIn();

  const clientId = await resolveClientIdFromAuth();
  if (!clientId) redirectToAccessRequired();

  const entitlements = await getClientEntitlements(clientId);
  const gated = !entitlements?.hasChatbotAccess;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://graft.today";

  return (
    <div className="w-full max-w-6xl space-y-8 mx-auto p-8 z-0">
      <div className="flex flex-col gap-2">
        <Typography.H1>Embed code</Typography.H1>
        <Typography.Lead>
          Seamlessly integrate your white-labelled AI assistant into any website or application. Choose the method that
          best fits your technical stack.
        </Typography.Lead>
      </div>
      {gated ? (
        <SubscriptionGate
          title="Your embed code is one step away"
          description="Put your AI assistant live on any website with a single snippet. Subscribe to the Graft AI Agent to reveal your workspace's embed code."
          highlights={["One-line website install", "Works on any stack", "24/7traging"]}
        >
          {/* Do not leak the real embed snippet into gated markup */}
          <IntegrationGuide clientId="subscription-required" baseUrl={baseUrl} />
        </SubscriptionGate>
      ) : (
        <IntegrationGuide clientId={clientId} baseUrl={baseUrl} />
      )}
    </div>
  );
}
