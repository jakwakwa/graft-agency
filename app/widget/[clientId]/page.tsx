import { agentService } from "@/lib/services/agent.service";
import { ChatWidget } from "./_components/chat-widget";

interface WidgetPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function WidgetPage({ params }: WidgetPageProps) {
  const { clientId } = await params;

  let agentName = "AI Assistant";
  let greetingMessage = "Hello! How can I help you today?";
  let primaryColour = "#7c3aed";

  try {
    const config = await agentService.getConfig(clientId);
    agentName = config.agentName ?? agentName;
    greetingMessage = config.greetingMessage ?? greetingMessage;
    primaryColour = config.widgetPrimaryColour ?? primaryColour;
  } catch {
    // Use defaults if config not found
  }

  return (
    <main className="flex h-dvh w-full flex-col">
      <ChatWidget
        clientId={clientId}
        agentName={agentName}
        greetingMessage={greetingMessage}
        primaryColour={primaryColour}
      />
    </main>
  );
}
