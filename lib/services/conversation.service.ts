import prisma from "@/lib/db/prisma";
import type { Prisma } from "../../generated/prisma/client";

interface SaveConversationInput {
  clientId: string;
  messages: Prisma.InputJsonValue;
  sessionId: string;
}

interface FindConversationBySessionInput {
  clientId: string;
  sessionId: string;
}

export const conversationService = {
  async save(input: SaveConversationInput) {
    const existingConversation = await prisma.conversation.findUnique({
      where: { sessionId: input.sessionId },
      select: { clientId: true },
    });

    if (existingConversation && existingConversation.clientId !== input.clientId) {
      throw new Error(`Conversation session "${input.sessionId}" belongs to a different client`);
    }

    if (existingConversation) {
      await prisma.conversation.update({
        where: { sessionId: input.sessionId },
        data: {
          messages: input.messages,
        },
      });
      return;
    }

    await prisma.conversation.create({
      data: {
        clientId: input.clientId,
        sessionId: input.sessionId,
        messages: input.messages,
      },
    });
  },

  async findBySession({ clientId, sessionId }: FindConversationBySessionInput) {
    return prisma.conversation.findFirst({
      where: { clientId, sessionId },
    });
  },
};
