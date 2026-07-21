import { headers } from "next/headers";
import { createWidgetToken } from "@/lib/security/widget-token";
import { agentService } from "@/lib/services/agent.service";
import { ChatWidget } from "./_components/chat-widget";

interface WidgetPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function WidgetPage({ params }: WidgetPageProps) {
  const { clientId } = await params;
  const requestHeaders = await headers();
  const embedOrigin = resolveEmbedOrigin(requestHeaders);

  let agentName = "AI Assistant";
  let greetingMessage = "Hello! How can I help you today?";
  let primaryColour = "#5F75F4";
  let secondaryColour: string | null = "#1e1b4b";
  let widgetToken: string | null = null;

  try {
    const config = await agentService.getConfig(clientId);
    agentName = config.agentName ?? agentName;
    greetingMessage = config.greetingMessage ?? greetingMessage;
    primaryColour = config.widgetPrimaryColour ?? primaryColour;
    secondaryColour = config.widgetSecondaryColour ?? secondaryColour;
  } catch {
    // Use defaults if config not found
  }

  if (clientId !== "platform" && embedOrigin) {
    try {
      widgetToken = await createWidgetToken({ clientId, origin: embedOrigin });
    } catch (err) {
      console.error("[Widget] Failed to create widget token:", err);
    }
  }

  return (
    <main className="flex h-dvh w-full flex-col">
      <ChatWidget
        clientId={clientId}
        agentName={agentName}
        embedOrigin={embedOrigin}
        greetingMessage={greetingMessage}
        primaryColour={primaryColour}
        secondaryColour={secondaryColour}
        widgetToken={widgetToken}
      />
    </main>
  );
}

function resolveEmbedOrigin(requestHeaders: Headers): string | null {
  const referer = requestHeaders.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return null;
    }
  }

  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) return null;
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
}
