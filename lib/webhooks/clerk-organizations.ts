import { z } from "zod";
import prisma from "@/lib/db/prisma";

const organizationPayloadSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
});

const deletedPayloadSchema = z.object({
  id: z.string().min(1),
});

const membershipPayloadSchema = z.object({
  organization: z.object({
    id: z.string().min(1),
  }),
  public_user_data: z.object({
    user_id: z.string().min(1),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    identifier: z.string().optional(),
  }),
});

const membershipDeletedPayloadSchema = z.object({
  public_user_data: z.object({
    user_id: z.string().min(1),
  }),
});

export type ClerkOrganizationWebhookResult =
  | { handled: true; action: "upserted" | "soft_deleted" | "skipped"; eventType: string }
  | { handled: false; eventType: string };

/**
 * Applies Clerk organization and membership lifecycle events to the `Client` table.
 * Refactored to Org-as-Agency + Member-as-Tenant model.
 */
export async function applyClerkOrganizationWebhook(
  eventType: string,
  data: unknown,
): Promise<ClerkOrganizationWebhookResult> {
  // 1. organization.deleted - defensive soft-delete of all clients in that org
  if (eventType === "organization.deleted") {
    const parsed = deletedPayloadSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error("Invalid Clerk organization deleted payload");
    }
    await prisma.client.updateMany({
      where: { clerkOrganizationId: parsed.data.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { handled: true, action: "soft_deleted", eventType };
  }

  // 2. organization.created - bootstrap only
  if (eventType === "organization.created") {
    const parsed = organizationPayloadSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error("Invalid Clerk organization payload");
    }

    const { id, name } = parsed.data;
    const businessName = name?.trim() ? name.trim() : "Agency";

    const shouldBootstrapPlatform =
      process.env.CLERK_WEBHOOK_BOOTSTRAP_PLATFORM === "true" &&
      (await prisma.client.count({ where: { isPlatformOwner: true } })) === 0;

    if (shouldBootstrapPlatform) {
      // count === 0 guarantees no existing row — use create (upsert requires a unique key)
      await prisma.client.create({
        data: {
          clerkOrganizationId: id,
          businessName,
          isPlatformOwner: true,
        },
      });
      return { handled: true, action: "upserted", eventType };
    }

    return { handled: true, action: "skipped", eventType };
  }

  // 3. organizationMembership.created - provisions a Client keyed by clerkUserId
  if (eventType === "organizationMembership.created") {
    const parsed = membershipPayloadSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error("Invalid Clerk membership created payload");
    }

    const { organization, public_user_data } = parsed.data;
    const userId = public_user_data.user_id;
    const orgId = organization.id;
    const email = public_user_data.identifier;
    const firstName = public_user_data.first_name ?? "";
    const lastName = public_user_data.last_name ?? "";
    const businessName = `${firstName} ${lastName}`.trim() || email || "New Client";

    // Check if this user is actually the existing platform owner row (backfill on first membership event)
    const ownerRow = await prisma.client.findFirst({
      where: { clerkOrganizationId: orgId, clerkUserId: null, isPlatformOwner: true },
    });

    if (ownerRow) {
      await prisma.client.update({
        where: { id: ownerRow.id },
        data: { clerkUserId: userId, email },
      });
      return { handled: true, action: "upserted", eventType };
    }

    await prisma.client.upsert({
      where: { clerkUserId: userId },
      create: {
        clerkUserId: userId,
        clerkOrganizationId: orgId,
        businessName,
        email,
      },
      update: { email }, // We don't overwrite businessName here as it might be customized in settings
    });

    return { handled: true, action: "upserted", eventType };
  }

  // 4. organizationMembership.deleted - soft-delete the Client matching clerkUserId
  if (eventType === "organizationMembership.deleted") {
    const parsed = membershipDeletedPayloadSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error("Invalid Clerk membership deleted payload");
    }

    await prisma.client.updateMany({
      where: { clerkUserId: parsed.data.public_user_data.user_id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return { handled: true, action: "soft_deleted", eventType };
  }

  return { handled: false, eventType };
}
