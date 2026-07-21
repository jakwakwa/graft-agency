"use client";

import { useChat } from "@ai-sdk/react";
import { BotFreeIcons, BubbleChatAddIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { TypographySmall } from "@/components/ui/typography";
import { buildWidgetTheme, widgetThemeToCssVars } from "@/lib/utils/widget-theme";
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
  secondaryColour: string | null;
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
  secondaryColour,
  widgetToken,
  onClose,
  onNewSession,
}: ChatSessionProps) {
  const [sessionId] = useState(() => readOrCreateSessionId(clientId));
  const [inputValue, setInputValue] = useState("");
  const [isEmbedded, setIsEmbedded] = useState(false);

  const themeVars = widgetThemeToCssVars(buildWidgetTheme(primaryColour, secondaryColour));

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
    <div
      className="flex h-full flex-col"
      style={{
        ...themeVars,
        boxShadow: "inset 0px 130px 60px rgba(254 235 235 / 5%)",
        backgroundColor: "var(--widget-primary-soft)",
        color: "var(--widget-on-surface)",
      }}
    >
      <header
        className="flex items-center gap-2 px-4 py-3"
        style={{
          background:
            "linear-gradient(135deg, var(--widget-primary) 0%, var(--widget-primary-deep) 55%, var(--widget-secondary) 140%)",
        }}
      >
    
         <HugeiconsIcon icon={BotFreeIcons} className="size-8" />
        <TypographySmall className="font-semibold flex-1" style={{ color: "var(--widget-on-primary)" }}>
          {agentName} <span className="italic font-light text-[9px] text-white/70 ml-2 mt-1  shadow-black shadow-sm bg-black/60 p-[4px] px-3 rounded-full">AI Powered by GRAFT</span>
         
        </TypographySmall>
        <div className="flex shrink-0 items-center gap-1">
          {hasMessages ? (
            <button
              type="button"
              onClick={onNewSession}
              disabled={isLoading}
              aria-label="Start new chat"
              className="flex size-8 items-center justify-center rounded-full transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ color: "var(--widget-on-primary)" }}
            >
              <HugeiconsIcon icon={BubbleChatAddIcon} className="size-5" /> 
            </button>
          ) : null}
          {showClose ? (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close chat"
              className="flex size-8 items-center justify-center rounded-full transition-opacity hover:opacity-80"
              style={{ color: "var(--widget-on-primary)" }}
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex justify-start">
            <div
              className="max-w-[80%] flex gap-2 font-display rounded-bl-0 rounded-tr-lg rounded-br-lg rounded-tl-lg px-4 py-2 text-xs"
              style={{
                backgroundColor: "var(--widget-surface-elevated)",
                color: "color-mix(in srgb, var(--widget-on-surface) 75%, transparent)",
                boxShadow: "0 7px 10px color-mix(in srgb, #000 35%, transparent)",
                outline: "1px solid var(--widget-border)",
              }}
            >
              <HugeiconsIcon icon={BotFreeIcons} className="size-6 shrink-0" />
              {greetingMessage}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        <div ref={bottomRef} />
      </div>

      <ChatInput input={inputValue} onChange={setInputValue} onSend={handleSend} isLoading={isLoading} />
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
                data-role={isUser ? "user" : "assistant"}
                className="rounded-2xl px-3 py-2 text-sm font-sans [&_a]:underline [&_a]:hover:opacity-80"
                style={
                  isUser
                    ? {
                        borderBottomRightRadius: "0.25rem",
                        background: "linear-gradient(160deg, var(--widget-primary-deep) 0%, var(--widget-primary) 70%)",
                        color: "var(--widget-on-primary)",
                      }
                    : {
                        borderBottomLeftRadius: "0.25rem",
                        backgroundColor: "var(--widget-secondary-soft)",
                        color: "var(--widget-on-secondary)",
                        outline: "1px solid var(--widget-border)",
                      }
                }
              >
                {isUser ? (
                  part.text
                ) : (
                  <Streamdown className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:text-[var(--widget-primary-soft)]">
                    {part.text}
                  </Streamdown>
                )}
              </div>
            );
          }

          if (part.type.startsWith("tool-") && "toolCallId" in part) {
            const toolPart = part as { type: string; toolCallId: string; state: string };
            const toolName = toolPart.type.slice(5);
            return <ToolStatus key={`tool-${toolPart.toolCallId}`} toolName={toolName} state={toolPart.state} />;
          }

          return null;
        })}
      </div>
    </div>
  );
}
