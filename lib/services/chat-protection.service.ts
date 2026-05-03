import { getPlatformClientId } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";
import { verifyWidgetToken } from "@/lib/security/widget-token";
import { operationalEventService } from "./operational-event.service";

const CHAT_RATE_WINDOW_MS = 60 * 1000;
const CHAT_RATE_LIMIT = 60;
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export type ChatDenialReason =
  | "CLIENT_NOT_FOUND"
  | "INACTIVE_SUBSCRIPTION"
  | "INVALID_ORIGIN"
  | "INVALID_WIDGET_TOKEN"
  | "MISSING_WIDGET_TOKEN"
  | "PLATFORM_CLIENT_NOT_CONFIGURED"
  | "RATE_LIMITED"
  | "TOKEN_NOT_CONFIGURED";

export type ChatAuthorisationResult =
  | { ok: true; clientId: string; isPlatformDemo: boolean }
  | { ok: false; clientId?: string; error: string; reason: ChatDenialReason; status: 401 | 403 | 429 | 503 };

interface AuthoriseChatInput {
  embedOrigin: string | null;
  requestedClientId: string;
  requestOrigin: string | null;
  requestReferer: string | null;
  sessionId?: string;
  token?: string;
}

interface RecordChatUsageInput {
  clientId: string;
  messageCount: number;
  model?: string;
  sessionId: string;
}

function normaliseOrigin(origin: string | null): string | null {
  if (!origin) return null;
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

function normaliseAllowedDomain(domain: string): string | null {
  const trimmed = domain.trim().toLowerCase();
  if (!trimmed) return null;
  try {
    return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`).hostname;
  } catch {
    return null;
  }
}

function isOriginAllowed(origin: string, allowedDomains: string[]): boolean {
  const hostname = new URL(origin).hostname.toLowerCase();
  return allowedDomains.some((domain) => {
    const allowed = normaliseAllowedDomain(domain);
    if (!allowed) return false;
    if (allowed.startsWith("*.")) {
      const suffix = allowed.slice(1);
      return hostname.endsWith(suffix);
    }
    return hostname === allowed;
  });
}

async function recordDenied(input: {
  clientId?: string;
  embedOrigin: string | null;
  reason: ChatDenialReason;
  requestedClientId: string;
  sessionId?: string;
}): Promise<void> {
  if (input.clientId) {
    try {
      await prisma.chatUsage.create({
        data: {
          clientId: input.clientId,
          denialReason: input.reason,
          messageCount: 0,
          sessionId: input.sessionId ?? "unknown",
          status: "DENIED",
        },
      });
    } catch (err) {
      console.error("[Chat protection] Failed to record denied chat usage:", err);
    }
  }

  await operationalEventService.record({
    category: "CHAT",
    clientId: input.clientId,
    eventType: "chat.denied",
    metadata: {
      embedOrigin: input.embedOrigin,
      reason: input.reason,
      requestedClientId: input.requestedClientId,
    },
    status: "DENIED",
  });
}

async function denied(input: {
  clientId?: string;
  embedOrigin: string | null;
  error: string;
  reason: ChatDenialReason;
  requestedClientId: string;
  sessionId?: string;
  status: 401 | 403 | 429 | 503;
}): Promise<ChatAuthorisationResult> {
  await recordDenied(input);
  return {
    ok: false,
    clientId: input.clientId,
    error: input.error,
    reason: input.reason,
    status: input.status,
  };
}

export const chatProtectionService = {
  async authorise(input: AuthoriseChatInput): Promise<ChatAuthorisationResult> {
    if (input.requestedClientId === "platform") {
      const clientId = await getPlatformClientId();
      if (!clientId) {
        return denied({
          embedOrigin: input.embedOrigin,
          error: "Platform client is not configured",
          reason: "PLATFORM_CLIENT_NOT_CONFIGURED",
          requestedClientId: input.requestedClientId,
          sessionId: input.sessionId,
          status: 503,
        });
      }
      return { ok: true, clientId, isPlatformDemo: true };
    }

    if (!input.token) {
      return denied({
        embedOrigin: input.embedOrigin,
        error: "Widget token is required",
        reason: "MISSING_WIDGET_TOKEN",
        requestedClientId: input.requestedClientId,
        sessionId: input.sessionId,
        status: 401,
      });
    }

    const token = await verifyWidgetToken(input.token);
    if (!token.ok) {
      return denied({
        embedOrigin: input.embedOrigin,
        error: token.reason === "MISSING_SECRET" ? "Widget token signing is not configured" : "Invalid widget token",
        reason: token.reason === "MISSING_SECRET" ? "TOKEN_NOT_CONFIGURED" : "INVALID_WIDGET_TOKEN",
        requestedClientId: input.requestedClientId,
        sessionId: input.sessionId,
        status: token.reason === "MISSING_SECRET" ? 503 : 401,
      });
    }

    const embedOrigin = normaliseOrigin(input.embedOrigin) ?? normaliseOrigin(input.requestReferer);
    if (token.payload.clientId !== input.requestedClientId || !embedOrigin || token.payload.origin !== embedOrigin) {
      return denied({
        embedOrigin,
        error: "Invalid widget token",
        reason: "INVALID_WIDGET_TOKEN",
        requestedClientId: input.requestedClientId,
        sessionId: input.sessionId,
        status: 401,
      });
    }

    const client = await prisma.client.findFirst({
      where: { id: input.requestedClientId, deletedAt: null },
      select: {
        allowedDomains: true,
        id: true,
        isPlatformOwner: true,
        subscriptionActive: true,
        subscriptionStatus: true,
      },
    });
    if (!client) {
      return denied({
        embedOrigin,
        error: "Client not found",
        reason: "CLIENT_NOT_FOUND",
        requestedClientId: input.requestedClientId,
        sessionId: input.sessionId,
        status: 403,
      });
    }

    if (!isOriginAllowed(embedOrigin, client.allowedDomains)) {
      return denied({
        clientId: client.id,
        embedOrigin,
        error: "Origin is not authorised for this widget",
        reason: "INVALID_ORIGIN",
        requestedClientId: input.requestedClientId,
        sessionId: input.sessionId,
        status: 403,
      });
    }

    const hasActiveSubscription =
      client.subscriptionActive && ACTIVE_SUBSCRIPTION_STATUSES.has(client.subscriptionStatus.toLowerCase());
    if (!hasActiveSubscription && !client.isPlatformOwner) {
      return denied({
        clientId: client.id,
        embedOrigin,
        error: "Client subscription is inactive",
        reason: "INACTIVE_SUBSCRIPTION",
        requestedClientId: input.requestedClientId,
        sessionId: input.sessionId,
        status: 403,
      });
    }

    const since = new Date(Date.now() - CHAT_RATE_WINDOW_MS);
    const recentAllowedMessages = await prisma.chatUsage.count({
      where: {
        clientId: client.id,
        createdAt: { gte: since },
        status: "ALLOWED",
      },
    });
    if (recentAllowedMessages >= CHAT_RATE_LIMIT) {
      return denied({
        clientId: client.id,
        embedOrigin,
        error: "Chat quota exceeded",
        reason: "RATE_LIMITED",
        requestedClientId: input.requestedClientId,
        sessionId: input.sessionId,
        status: 429,
      });
    }

    return { ok: true, clientId: client.id, isPlatformDemo: false };
  },

  async recordAllowedUsage(input: RecordChatUsageInput): Promise<void> {
    try {
      await prisma.chatUsage.create({
        data: {
          clientId: input.clientId,
          messageCount: input.messageCount,
          model: input.model,
          sessionId: input.sessionId,
          status: "ALLOWED",
        },
      });
      await operationalEventService.record({
        category: "AI_USAGE",
        clientId: input.clientId,
        eventType: "chat.usage",
        metadata: {
          messageCount: input.messageCount,
          model: input.model ?? null,
          sessionId: input.sessionId,
        },
        status: "SUCCESS",
      });
    } catch (err) {
      console.error("[Chat protection] Failed to record chat usage:", err);
    }
  },
};
