"use client";

import { MessageUser01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
            className={`fixed bottom-6 right-6 z-50 size-12 rounded-full outline-1 outline-[${primaryColour}] shadow-lg shadow-indigo-700 ring-3 ring-indigo-500`}
            aria-label="Open chat"
          />
        }
      >
        <HugeiconsIcon icon={MessageUser01FreeIcons} className="size-6" aria-hidden />
      </DialogTrigger>
      <DialogContent
        className="max-h-[min(96vh,640px)] w-[calc(100vw-3rem)] max-w-full gap-0 overflow-hidden p-0 sm:max-w-2xl"
        showCloseButton
      >
        <DialogTitle className="sr-only">Chat with {agentName}</DialogTitle>
        <div className="h-[min(80vh,660px)] w-full">
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
