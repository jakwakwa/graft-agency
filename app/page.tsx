import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { getPlatformClientId } from "@/lib/auth/resolve-client";
import { agentService } from "@/lib/services/agent.service";
import { ChatWidget } from "@/app/widget/[clientId]/_components/chat-widget";

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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Typography.H1>Hello, Welcome to Kona Agency</Typography.H1>
        <Typography.P className="text-lg text-muted-foreground">This is a test</Typography.P>
        <Button variant="default">Click me</Button>
        {platformClientId && (
          <section className="mt-12 w-full max-w-md border rounded-lg overflow-hidden shadow-lg">
            <div className="h-[400px]">
              <ChatWidget
                clientId="platform"
                agentName={agentName}
                greetingMessage={greetingMessage}
                primaryColour={primaryColour}
              />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
