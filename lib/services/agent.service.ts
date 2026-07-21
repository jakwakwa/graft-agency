import { cacheTags } from "@/lib/db/cache";
import prisma from "@/lib/db/prisma";
import type { Prisma } from "../../generated/prisma/client";

/** Stable id for synthetic configs (no DB row). Not persisted. */
const FALLBACK_AGENT_CONFIG_ID = "00000000-0000-4000-8000-000000000001";

/** Public site / `clientId=platform` launcher when no `agent_configs` row exists yet. */
export const PLATFORM_LANDING_WIDGET_DEFAULTS = {
  agentName: "GRAFT",
  greetingMessage: "Hi! I'm GRAFT AI Assistant — how can I help you today?",
  widgetPrimaryColour: "#000",
} as const;

type AgentConfigRow = Prisma.AgentConfigGetPayload<{}>;

function getOptionalEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function withCalendarDefaults(config: AgentConfigRow): AgentConfigRow {
  return {
    ...config,
    calComUsername: config.calComUsername?.trim() || getOptionalEnv("CAL_USER_USERNAME"),
    defaultEventSlug: config.defaultEventSlug?.trim() || getOptionalEnv("CAL_USER_EVENT_SLUG"),
  };
}

function createFallbackAgentConfig(clientId: string): AgentConfigRow {
  const now = new Date();
  return {
    id: FALLBACK_AGENT_CONFIG_ID,
    clientId,
    systemPrompt: "You are a helpful assistant. Help visitors and capture their contact details.",
    knowledgeBase: null,
    agentName: "AI Assistant",
    greetingMessage: "Hello! How can I help you today?",
    calComUsername: getOptionalEnv("CAL_USER_USERNAME"),
    defaultEventSlug: getOptionalEnv("CAL_USER_EVENT_SLUG"),
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
      cacheStrategy: { ttl: 30, swr: 120, tags: [cacheTags.agentConfig(clientId)] },
    });
    return config ? withCalendarDefaults(config) : createFallbackAgentConfig(clientId);
  },

  async searchKnowledge({ clientId, query }: SearchKnowledgeInput): Promise<SearchKnowledgeResult> {
    const normalisedQuery = query.trim().toLowerCase();
    if (normalisedQuery === "") {
      return { answer: "" };
    }

    const config = await prisma.agentConfig.findUnique({
      where: { clientId },
      cacheStrategy: { ttl: 30, swr: 120, tags: [cacheTags.agentConfig(clientId)] },
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
