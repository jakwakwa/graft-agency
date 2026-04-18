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
import { getPlatformClientId } from "@/lib/auth/resolve-client";
import { agentService, isSyntheticAgentConfig, PLATFORM_LANDING_WIDGET_DEFAULTS } from "@/lib/services/agent.service";
import { conversationService } from "@/lib/services/conversation.service";
import type { Prisma } from "../../../generated/prisma/client";

const chatRequestSchema = z.object({
  clientId: z.string().min(1),
  messages: z.array(z.unknown()),
  sessionId: z.string().min(1),
});

const toPrismaJson = (value: UIMessage[]): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export async function POST(req: Request) {
  const body = chatRequestSchema.safeParse(await req.json());
  if (!body.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const requestedClientId = body.data.clientId;
  let { clientId, messages, sessionId } = body.data;
  if (clientId === "platform") {
    const platformId = await getPlatformClientId();
    if (!platformId) {
      return Response.json({ error: "Platform client not configured" }, { status: 503 });
    }
    clientId = platformId;
  }

  let config = await agentService.getConfig(clientId);
  if (requestedClientId === "platform" && isSyntheticAgentConfig(config)) {
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
      await conversationService.save({
        clientId,
        sessionId,
        messages: toPrismaJson(finalMessages),
      });
    },
  });

  return createUIMessageStreamResponse({ stream });
}
