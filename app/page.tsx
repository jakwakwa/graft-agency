import { LandingChatLauncher } from "@/components/marketing/landing-chat-launcher";
import LandingPageV2 from "@/components/marketing/landing-v2/landing-page-v2";
import { getPlatformClientId } from "@/lib/auth/resolve-client";
import { agentService, isSyntheticAgentConfig, PLATFORM_LANDING_WIDGET_DEFAULTS } from "@/lib/services/agent.service";

export default async function Home() {
  const platformClientId = await getPlatformClientId();
  let agentName: string = PLATFORM_LANDING_WIDGET_DEFAULTS.agentName;
  let greetingMessage: string = PLATFORM_LANDING_WIDGET_DEFAULTS.greetingMessage;
  let primaryColour: string = PLATFORM_LANDING_WIDGET_DEFAULTS.widgetPrimaryColour;

  if (platformClientId) {
    const config = await agentService.getConfig(platformClientId);
    if (isSyntheticAgentConfig(config)) {
      // No DB row yet — keep marketing defaults (same as previous try/catch path).
    } else {
      agentName = config.agentName ?? agentName;
      greetingMessage = config.greetingMessage ?? greetingMessage;
      primaryColour = config.widgetPrimaryColour ?? primaryColour;
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <LandingPageV2 />
      </main>
      <LandingChatLauncher
        platformClientId={platformClientId}
        clientId="platform"
        agentName={agentName}
        greetingMessage={greetingMessage}
        primaryColour={primaryColour}
      />
    </div>
  );
}
