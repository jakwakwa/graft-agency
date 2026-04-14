import { z } from "zod";
import prisma from "@/lib/db/prisma";

const organizationPayloadSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
});

const deletedPayloadSchema = z.object({
  id: z.string().min(1),
});

export type ClerkOrganizationWebhookResult =
  | { handled: true; action: "upserted" | "soft_deleted" | "skipped"; eventType: string }
  | { handled: false; eventType: string };

/**
 * Applies Clerk organisation lifecycle events to the `Client` table.
 * Standard B2B pattern: Clerk is the source of truth for org ids; Graft stores the provisioned client row.
 */
export async function applyClerkOrganizationWebhook(
  eventType: string,
  data: unknown,
): Promise<ClerkOrganizationWebhookResult> {
  if (eventType === "organization.deleted") {
    const parsed = deletedPayloadSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error("Invalid Clerk organisation deleted payload");
    }
    await prisma.client.updateMany({
      where: { clerkOrganizationId: parsed.data.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { handled: true, action: "soft_deleted", eventType };
  }

  if (eventType !== "organization.created" && eventType !== "organization.updated") {
    return { handled: false, eventType };
  }

  const parsed = organizationPayloadSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid Clerk organisation payload");
  }

  const { id, name } = parsed.data;
  const businessName = name?.trim() ? name.trim() : "Organisation";

  const shouldBootstrapPlatform =
    process.env.CLERK_WEBHOOK_BOOTSTRAP_PLATFORM === "true" &&
    eventType === "organization.created" &&
    (await prisma.client.count({ where: { isPlatformOwner: true } })) === 0;

  await prisma.client.upsert({
    where: { clerkOrganizationId: id },
    create: {
      clerkOrganizationId: id,
      businessName,
      ...(shouldBootstrapPlatform ? { isPlatformOwner: true } : {}),
    },
    update: { businessName },
  });

  return { handled: true, action: "upserted", eventType };
}
