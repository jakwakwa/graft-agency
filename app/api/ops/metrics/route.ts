import { requirePlatformOwnerAccess } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";

export async function GET() {
  const access = await requirePlatformOwnerAccess();
  if ("error" in access) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    allowedChats,
    deniedChats,
    usageAggregate,
    failedWebhooks,
    pendingWebhooks,
    oldestPendingWebhook,
    recentEvents,
  ] = await Promise.all([
    prisma.chatUsage.count({ where: { createdAt: { gte: since }, status: "ALLOWED" } }),
    prisma.chatUsage.count({ where: { createdAt: { gte: since }, status: "DENIED" } }),
    prisma.chatUsage.aggregate({
      _sum: { completionTokens: true, promptTokens: true, totalTokens: true },
      where: { createdAt: { gte: since }, status: "ALLOWED" },
    }),
    prisma.webhookReceipt.count({ where: { receivedAt: { gte: since }, status: "FAILED" } }),
    prisma.webhookReceipt.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
    prisma.webhookReceipt.findFirst({
      orderBy: { receivedAt: "asc" },
      select: { receivedAt: true },
      where: { status: { in: ["PENDING", "PROCESSING"] } },
    }),
    prisma.operationalEvent.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        category: true,
        clientId: true,
        createdAt: true,
        eventType: true,
        id: true,
        message: true,
        status: true,
      },
      take: 20,
      where: { createdAt: { gte: since } },
    }),
  ]);

  const oldestWebhookLagSeconds = oldestPendingWebhook
    ? Math.max(0, Math.floor((Date.now() - oldestPendingWebhook.receivedAt.getTime()) / 1000))
    : 0;

  return Response.json({
    chat: {
      allowed: allowedChats,
      denied: deniedChats,
      completionTokens: usageAggregate._sum.completionTokens ?? 0,
      promptTokens: usageAggregate._sum.promptTokens ?? 0,
      totalTokens: usageAggregate._sum.totalTokens ?? 0,
    },
    events: recentEvents,
    window: {
      since: since.toISOString(),
    },
    webhooks: {
      failed: failedWebhooks,
      oldestPendingLagSeconds: oldestWebhookLagSeconds,
      pending: pendingWebhooks,
    },
  });
}
