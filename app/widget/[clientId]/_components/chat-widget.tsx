"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { TypographySmall } from "@/components/ui/typography";
import { ChatInput } from "./chat-input";
import { ToolStatus } from "./tool-status";

interface ChatWidgetProps {
  clientId: string;
  agentName: string;
  greetingMessage: string;
  primaryColour: string;
}

function generateSessionId() {
  return `kona-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ChatWidget({ clientId, agentName, greetingMessage, primaryColour }: ChatWidgetProps) {
  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return generateSessionId();
    const stored = sessionStorage.getItem(`kona-session-${clientId}`);
    if (stored) return stored;
    const id = generateSessionId();
    sessionStorage.setItem(`kona-session-${clientId}`, id);
    return id;
  });

  const [inputValue, setInputValue] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { clientId, sessionId },
    }),
    messages: loadMessagesFromStorage(clientId),
  });

  const bottomRef = useRef<HTMLDivElement>(null);

  // Persist messages to sessionStorage
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(`kona-chat-${clientId}`, JSON.stringify(messages));
    }
  }, [messages, clientId]);

  // Auto-scroll to bottom when messages change
  const _messageCount = messages.length;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

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
      {/* Header */}
      <header className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: primaryColour }}>
        <div
          className="flex size-8 items-center justify-center rounded-full text-sm font-bold"
          style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            color: "#fff",
          }}
        >
          {agentName.charAt(0).toUpperCase()}
        </div>
        <TypographySmall className="font-semibold text-white">{agentName}</TypographySmall>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Greeting */}
        {messages.length === 0 && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm">{greetingMessage}</div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        input={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        isLoading={status === "streaming" || status === "submitted"}
        primaryColour={primaryColour}
      />
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[80%] space-y-1">
        {message.parts.map((part) => {
          if (part.type === "text" && part.text) {
            return (
              <div
                key={`text-${part.text.slice(0, 20)}`}
                className={`rounded-2xl px-3 py-2 text-sm [&_a]:underline [&_a]:text-primary [&_a]:hover:opacity-80 ${
                  isUser ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted"
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

function loadMessagesFromStorage(clientId: string): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = sessionStorage.getItem(`kona-chat-${clientId}`);
    if (!stored) return [];
    return JSON.parse(stored) as UIMessage[];
  } catch {
    return [];
  }
}
