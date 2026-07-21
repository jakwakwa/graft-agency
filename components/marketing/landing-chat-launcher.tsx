"use client";

import { MessageUser01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { ChatWidget } from "@/app/widget/[clientId]/_components/chat-widget";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { buildWidgetTheme } from "@/lib/utils/widget-theme";

export function shouldShowLandingChat(platformClientId: string | null | undefined): boolean {
  return Boolean(platformClientId?.trim());
}

interface LandingChatLauncherProps {
  platformClientId: string | null | undefined;
  clientId: string;
  agentName: string;
  greetingMessage: string;
  primaryColour: string;
  secondaryColour: string;
}

export function LandingChatLauncher({
  platformClientId,
  clientId,
  agentName,
  greetingMessage,
  primaryColour,
  secondaryColour,
}: LandingChatLauncherProps) {
  const [open, setOpen] = useState(false);

  if (!shouldShowLandingChat(platformClientId)) {
    return null;
  }

  const theme = buildWidgetTheme(primaryColour, secondaryColour);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="default"
            size="icon"
            className="fixed bottom-6 right-6 z-50 size-12 rounded-full"
            style={{
              background: `linear-gradient(145deg, ${theme.primarySoft} 0%, ${theme.primary} 55%, ${theme.secondary} 120%)`,
              color: theme.onPrimary,
              boxShadow: `0 0 0 3px ${theme.focusRing}, 0 10px 24px color-mix(in srgb, ${theme.primaryDeep} 45%, transparent)`,
            }}
            aria-label="Open chat"
          />
        }
      >
        <HugeiconsIcon icon={MessageUser01FreeIcons} className="size-6" aria-hidden />
      </DialogTrigger>
      <DialogContent
        className="max-h-[min(96vh,640px)] w-[calc(100vw-3rem)] max-w-full gap-0 overflow-hidden p-0 sm:max-w-2xl"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Chat with {agentName}</DialogTitle>
        <div className="h-[min(80vh,660px)] w-full">
          <ChatWidget
            clientId={clientId}
            agentName={agentName}
            embedOrigin={null}
            greetingMessage={greetingMessage}
            primaryColour={primaryColour}
            secondaryColour={secondaryColour}
            widgetToken={null}
            onClose={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
