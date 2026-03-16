import prisma from "@/lib/db/prisma";
import type { Prisma } from "../../generated/prisma/client";

interface SearchKnowledgeResult {
  answer: string;
  sources?: string[];
}

interface SearchKnowledgeInput {
  clientId: string;
  query: string;
}

interface KnowledgeBaseEntry {
  answer: string;
  question: string;
}

const isKnowledgeBaseEntry = (value: Prisma.JsonValue): value is Prisma.JsonObject & KnowledgeBaseEntry => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.question === "string" && typeof record.answer === "string";
};

export const agentService = {
  async getConfig(clientId: string) {
    const config = await prisma.agentConfig.findUnique({
      where: { clientId },
    });
    if (!config) {
      throw new Error(`AgentConfig not found for client: ${clientId}`);
    }
    return config;
  },

  async searchKnowledge({ clientId, query }: SearchKnowledgeInput): Promise<SearchKnowledgeResult> {
    const normalisedQuery = query.trim().toLowerCase();
    if (normalisedQuery === "") {
      return { answer: "" };
    }

    const config = await prisma.agentConfig.findUnique({
      where: { clientId },
    });

    if (!config?.knowledgeBase || !Array.isArray(config.knowledgeBase)) {
      return { answer: "" };
    }

    const entries = config.knowledgeBase.filter(isKnowledgeBaseEntry);
    const matches = entries.filter(
      (entry) =>
        entry.question.toLowerCase().includes(normalisedQuery) || entry.answer.toLowerCase().includes(normalisedQuery),
    );

    if (matches.length === 0) {
      return { answer: "" };
    }

    return {
      answer: matches.map((m) => m.answer).join("\n"),
      sources: ["Knowledge Base"],
    };
  },
};
