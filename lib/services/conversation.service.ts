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

  async listForClient(
    clientId: string,
  ): Promise<Prisma.ConversationGetPayload<{ include: { lead: { select: { customerName: true; email: true } } } }>[]> {
    return prisma.conversation.findMany({
      where: { clientId },
      orderBy: { updatedAt: "desc" },
      include: {
        lead: {
          select: {
            customerName: true,
            email: true,
          },
        },
      },
    }) as never;
  },

  async getById(
    id: string,
    clientId: string,
  ): Promise<Prisma.ConversationGetPayload<{ include: { lead: true } }> | null> {
    return prisma.conversation.findFirst({
      where: { id, clientId },
      include: {
        lead: true,
      },
    }) as never;
  },
};
