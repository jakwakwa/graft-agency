"use client";

import { useChat } from "@ai-sdk/react";
import { BotFreeIcons, BubbleChatAddIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { TypographySmall } from "@/components/ui/typography";
import { ChatInput } from "./chat-input";
import { ToolStatus } from "./tool-status";
import {
  clearWidgetSession,
  loadMessagesFromStorage,
  persistMessagesToStorage,
  readOrCreateSessionId,
} from "./widget-session";

export const WIDGET_CLOSE_MESSAGE_TYPE = "graft-today:close";

interface ChatWidgetProps {
  clientId: string;
  agentName: string;
  embedOrigin: string | null;
  greetingMessage: string;
  primaryColour: string;
  widgetToken: string | null;
  /** When provided (e.g. landing dialog), closes the host shell. */
  onClose?: () => void;
}

export function ChatWidget(props: ChatWidgetProps) {
  const [sessionKey, setSessionKey] = useState(0);

  const startNewSession = useCallback(() => {
    clearWidgetSession(props.clientId);
    setSessionKey((key) => key + 1);
  }, [props.clientId]);

  return <ChatSession key={sessionKey} {...props} onNewSession={startNewSession} />;
}

interface ChatSessionProps extends ChatWidgetProps {
  onNewSession: () => void;
}

function ChatSession({
  clientId,
  agentName,
  embedOrigin,
  greetingMessage,
  primaryColour,
  widgetToken,
  onClose,
  onNewSession,
}: ChatSessionProps) {
  const [sessionId] = useState(() => readOrCreateSessionId(clientId));
  const [inputValue, setInputValue] = useState("");
  const [isEmbedded, setIsEmbedded] = useState(false);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { clientId, embedOrigin, sessionId, token: widgetToken ?? undefined },
    }),
    messages: loadMessagesFromStorage(clientId),
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "streaming" || status === "submitted";
  const hasMessages = messages.length > 0;
  const showClose = Boolean(onClose) || isEmbedded;

  useEffect(() => {
    setIsEmbedded(window.parent !== window);
  }, []);

  useEffect(() => {
    persistMessagesToStorage(clientId, messages);
  }, [messages, clientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }
    if (window.parent !== window) {
      window.parent.postMessage({ type: WIDGET_CLOSE_MESSAGE_TYPE }, "*");
    }
  }, [onClose]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setInputValue("");
      await sendMessage({ text });
    },
    [sendMessage],
  );

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 px-4 bg-primary py-3" style={{ backgroundColor: primaryColour }}>
        <div
          className="flex size-8 items-center justify-center rounded-full text-sm font-bold"
          style={{
            color: `${primaryColour}`,
            backgroundColor: "hsl(35.71 100% 11.76%)",
          }}
        >
          {agentName.charAt(0).toUpperCase()}
        </div>
        <TypographySmall className="font-semibold text-black flex-1">{agentName} ASSISTANT</TypographySmall>
        <div className="flex shrink-0 items-center gap-1">
          {hasMessages ? (
            <button
              type="button"
              onClick={onNewSession}
              disabled={isLoading}
              aria-label="Start new chat"
              className="flex size-8 items-center justify-center rounded-full text-black/80 transition-opacity hover:bg-black/10 disabled:opacity-40"
            >
              <HugeiconsIcon icon={BubbleChatAddIcon} className="size-5" />
            </button>
          ) : null}
          {showClose ? (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close chat"
              className="flex size-8 items-center justify-center rounded-full text-black/80 transition-opacity hover:bg-black/10"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex justify-start">
            <div className="max-w-[80%] flex gap-2 font-display outline-1 outline-white/10 rounded-bl-0 rounded-tr-lg rounded-br-lg rounded-tl-lg shadow-[0_7px_10px] shadow-black bg-stone-800 px-4 py-2 text-white/70 text-xs">
              <HugeiconsIcon icon={BotFreeIcons} className="size-6" />
              {greetingMessage}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        <div ref={bottomRef} />
      </div>

      <ChatInput
        input={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        isLoading={isLoading}
        primaryColour={primaryColour}
      />
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="min-w-[90%] space-y-1">
        {message.parts.map((part) => {
          if (part.type === "text" && part.text) {
            return (
              <div
                key={`text-${part.text.slice(0, 20)}`}
                className={`rounded-2xl px-3 py-2 text-sm [&_a]:underline [&_a]:text-primary [&_a]:hover:opacity-80 ${
                  isUser
                    ? "rounded-br-sm bg-primary font-sans text-primary-foreground"
                    : "rounded-bl-sm font-sans bg-muted"
                }`}
              >
                {isUser ? (
                  part.text
                ) : (
                  <Streamdown className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{part.text}</Streamdown>
                )}
              </div>
            );
          }

          if (part.type.startsWith("tool-") && "toolCallId" in part) {
            const toolPart = part as { type: string; toolCallId: string; state: string };
            // AI SDK v6: type is "tool-{toolName}", e.g. "tool-captureLeadDetails"
            const toolName = toolPart.type.slice(5);
            return <ToolStatus key={`tool-${toolPart.toolCallId}`} toolName={toolName} state={toolPart.state} />;
          }

          return null;
        })}
      </div>
    </div>
  );
}
