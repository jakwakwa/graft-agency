import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { selectModel } from "@/lib/ai/model-router";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { createTools } from "@/lib/ai/tools";
import { agentService, isSyntheticAgentConfig, PLATFORM_LANDING_WIDGET_DEFAULTS } from "@/lib/services/agent.service";
import { chatProtectionService } from "@/lib/services/chat-protection.service";
import { conversationService } from "@/lib/services/conversation.service";
import type { Prisma } from "../../../generated/prisma/client";

const chatRequestSchema = z.object({
  clientId: z.string().min(1),
  embedOrigin: z.string().min(1).nullable().optional(),
  messages: z.array(z.unknown()),
  sessionId: z.string().min(1),
  token: z.string().min(1).optional(),
});

const toPrismaJson = (value: UIMessage[]): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const body = chatRequestSchema.safeParse(payload);
  if (!body.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const requestedClientId = body.data.clientId;
  const { messages, sessionId } = body.data;
  const authorisation = await chatProtectionService.authorise({
    embedOrigin: body.data.embedOrigin ?? null,
    requestedClientId,
    requestOrigin: req.headers.get("origin"),
    requestReferer: req.headers.get("referer"),
    sessionId,
    token: body.data.token,
  });

  if (!authorisation.ok) {
    return Response.json(
      { error: authorisation.error, reason: authorisation.reason },
      { status: authorisation.status },
    );
  }

  const { clientId } = authorisation;
  let config = await agentService.getConfig(clientId);
  if (authorisation.isPlatformDemo && isSyntheticAgentConfig(config)) {
    config = {
      ...config,
      agentName: PLATFORM_LANDING_WIDGET_DEFAULTS.agentName,
      greetingMessage: PLATFORM_LANDING_WIDGET_DEFAULTS.greetingMessage,
    };
  }
  const systemPrompt = buildSystemPrompt(config);
  const tools = createTools(clientId);

  const model = selectModel(Object.keys(tools));
  let modelMessages: Awaited<ReturnType<typeof convertToModelMessages>>;

  try {
    modelMessages = await convertToModelMessages(messages as UIMessage[]);
  } catch {
    return Response.json({ error: "Invalid messages payload" }, { status: 400 });
  }

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model,
        system: systemPrompt,
        messages: modelMessages,
        stopWhen: stepCountIs(5),
        tools,
      });
      writer.merge(result.toUIMessageStream());
    },
    onFinish: async ({ messages: finalMessages }) => {
      try {
        await conversationService.save({
          clientId,
          sessionId,
          messages: toPrismaJson(finalMessages),
        });
        await chatProtectionService.recordAllowedUsage({
          clientId,
          messageCount: finalMessages.length,
          model: typeof model === "string" ? model : "selected-model",
          sessionId,
        });
      } catch (err) {
        console.error("[Chat route] Failed to persist chat completion:", err);
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
