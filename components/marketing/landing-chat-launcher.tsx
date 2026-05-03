"use client";

import { MessageCircle } from "lucide-react";
import { ChatWidget } from "@/app/widget/[clientId]/_components/chat-widget";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function shouldShowLandingChat(platformClientId: string | null | undefined): boolean {
  return Boolean(platformClientId?.trim());
}

interface LandingChatLauncherProps {
  platformClientId: string | null | undefined;
  clientId: string;
  agentName: string;
  greetingMessage: string;
  primaryColour: string;
}

export function LandingChatLauncher({
  platformClientId,
  clientId,
  agentName,
  greetingMessage,
  primaryColour,
}: LandingChatLauncherProps) {
  if (!shouldShowLandingChat(platformClientId)) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="default"
            size="icon"
            className="fixed bottom-6 right-6 z-50 size-12 rounded-full shadow-md ring-1 ring-foreground/10"
            aria-label="Open chat"
          />
        }
      >
        <MessageCircle className="size-5" aria-hidden />
      </DialogTrigger>
      <DialogContent
        className="max-h-[min(90vh,640px)] w-[calc(100vw-2rem)] max-w-md gap-0 overflow-hidden p-0 sm:max-w-md"
        showCloseButton
      >
        <DialogTitle className="sr-only">Chat with {agentName}</DialogTitle>
        <div className="h-[min(70vh,560px)] w-full">
          <ChatWidget
            clientId={clientId}
            agentName={agentName}
            embedOrigin={null}
            greetingMessage={greetingMessage}
            primaryColour={primaryColour}
            widgetToken={null}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
