import prisma from "@/lib/db/prisma";
import type { Prisma } from "../../generated/prisma/client";

/** Stable id for synthetic configs (no DB row). Not persisted. */
const FALLBACK_AGENT_CONFIG_ID = "00000000-0000-4000-8000-000000000001";

/** Public site / `clientId=platform` launcher when no `agent_configs` row exists yet. */
export const PLATFORM_LANDING_WIDGET_DEFAULTS = {
  agentName: "GRAFT",
  greetingMessage: "Hi! I'm GraftBot — how can I help you today?",
  widgetPrimaryColour: "#E49B57",
} as const;

type AgentConfigRow = NonNullable<Awaited<ReturnType<typeof prisma.agentConfig.findUnique>>>;

function createFallbackAgentConfig(clientId: string): AgentConfigRow {
  const now = new Date();
  return {
    id: FALLBACK_AGENT_CONFIG_ID,
    clientId,
    systemPrompt: "You are a helpful assistant. Help visitors and capture their contact details.",
    knowledgeBase: null,
    agentName: "AI Assistant",
    greetingMessage: "Hello! How can I help you today?",
    calComUsername: null,
    defaultEventSlug: null,
    widgetPrimaryColour: "#7c3aed",
    createdAt: now,
    updatedAt: now,
  };
}

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

/** True when `getConfig` returned an in-memory default (no `agent_configs` row for this client). */
export function isSyntheticAgentConfig(config: AgentConfigRow): boolean {
  return config.id === FALLBACK_AGENT_CONFIG_ID;
}

export const agentService = {
  async getConfig(clientId: string): Promise<AgentConfigRow> {
    const config = await prisma.agentConfig.findUnique({
      where: { clientId },
    });
    return config ?? createFallbackAgentConfig(clientId);
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
