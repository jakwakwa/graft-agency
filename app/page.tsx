import { LandingChatLauncher } from "@/components/marketing/landing-chat-launcher";
import { LandingFeatures } from "@/components/marketing/landing-features";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { LandingHero } from "@/components/marketing/landing-hero";
import { getPlatformClientId } from "@/lib/auth/resolve-client";
import { agentService } from "@/lib/services/agent.service";

export default async function Home() {
  const platformClientId = await getPlatformClientId();
  let agentName = "Kona";
  let greetingMessage = "Hi! I'm Kona — how can I help you today?";
  let primaryColour = "#7c3aed";

  if (platformClientId) {
    try {
      const config = await agentService.getConfig(platformClientId);
      agentName = config.agentName ?? agentName;
      greetingMessage = config.greetingMessage ?? greetingMessage;
      primaryColour = config.widgetPrimaryColour ?? primaryColour;
    } catch {
      // Use defaults
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingFooter />
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
