import { z } from "zod";
import { getPlatformClientId, resolveClientIdFromAuth } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";

const createSchema = z.object({
  clerkUserId: z.string().min(1),
  clerkOrganizationId: z.string().min(1).optional(),
  businessName: z.string().min(1).max(500),
  industry: z.string().max(200).optional(),
  websiteUrl: z.string().url().max(2048).optional(),
  systemPrompt: z.string().min(1).optional(),
  agentName: z.string().max(100).optional(),
  greetingMessage: z.string().max(500).optional(),
});

/**
 * Transactional client onboarding: creates Client + AgentConfig in one transaction.
 * Platform-owner only.
 */
export async function POST(req: Request) {
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const platformId = await getPlatformClientId();
  if (!platformId || clientId !== platformId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = createSchema.safeParse(await req.json());
  if (!body.success) {
    return Response.json({ error: "Invalid request body", details: body.error.flatten() }, { status: 400 });
  }

  const input = body.data;

  try {
    const client = await prisma.$transaction(async (tx) => {
      const c = await tx.client.create({
        data: {
          clerkUserId: input.clerkUserId,
          clerkOrganizationId: input.clerkOrganizationId,
          businessName: input.businessName,
          industry: input.industry,
          websiteUrl: input.websiteUrl,
        },
      });
      await tx.agentConfig.create({
        data: {
          clientId: c.id,
          systemPrompt:
            input.systemPrompt ?? "You are a helpful assistant. Help visitors and capture their contact details.",
          agentName: input.agentName ?? "AI Assistant",
          greetingMessage: input.greetingMessage ?? "Hello! How can I help you today?",
        },
      });
      return c;
    });

    return Response.json(client, { status: 201 });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return Response.json({ error: "Client with this user ID already exists" }, { status: 409 });
    }
    console.error("[Client onboarding] Failed:", err);
    return Response.json({ error: "Failed to create client" }, { status: 500 });
  }
}
