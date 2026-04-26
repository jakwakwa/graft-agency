"use client";

import type { UIMessage } from "ai";
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput, type ToolPart } from "@/components/ai-elements/tool";

interface ConversationViewerProps {
  messages: UIMessage[];
}

export function ConversationViewer({ messages }: ConversationViewerProps) {
  return (
    <Conversation className="h-full bg-card overflow-y-auto">
      <ConversationContent className="p-6">
        {messages.map((message) => (
          <Message key={message.id} from={message.role}>
            <MessageContent>
              {message.parts.map((part, partIndex) => {
                const partKey = `${message.id}-part-${partIndex}`;
                if (part.type === "text") {
                  return <MessageResponse key={partKey}>{part.text}</MessageResponse>;
                }

                if (part.type.startsWith("tool-")) {
                  const toolPart = part as unknown as ToolPart;
                  const toolName = part.type.slice(5);

                  return (
                    <Tool key={partKey}>
                      <ToolHeader type="dynamic-tool" toolName={toolName} state={toolPart.state} />
                      <ToolContent>
                        <ToolInput input={toolPart.input} wrap />
                        {(toolPart.output || toolPart.errorText) && (
                          <ToolOutput output={toolPart.output} errorText={toolPart.errorText} wrap />
                        )}
                      </ToolContent>
                    </Tool>
                  );
                }

                return null;
              })}
            </MessageContent>
          </Message>
        ))}
      </ConversationContent>
    </Conversation>
  );
}
