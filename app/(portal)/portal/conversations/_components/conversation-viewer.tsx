"use client";

import type { UIMessage } from "ai";
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";

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

                if (part.type === "tool-invocation") {
                  const { toolInvocation } = part;
                  return (
                    <Tool key={partKey}>
                      <ToolHeader type="dynamic-tool" toolName={toolInvocation.toolName} state={toolInvocation.state} />
                      <ToolContent>
                        <ToolInput input={toolInvocation.args} wrap />
                        {"result" in toolInvocation && (
                          <ToolOutput
                            output={toolInvocation.result}
                            errorText={"error" in toolInvocation ? String(toolInvocation.error) : null}
                            wrap
                          />
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
