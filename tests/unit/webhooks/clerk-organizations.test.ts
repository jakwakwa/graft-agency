import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/db/prisma";
import { applyClerkOrganizationWebhook } from "@/lib/webhooks/clerk-organizations";

describe("applyClerkOrganizationWebhook", () => {
  const orgId = `test-clerk-webhook-org-${Date.now()}`;
  const userId = `test-clerk-webhook-user-${Date.now()}`;

  afterEach(async () => {
    await prisma.client.deleteMany({
      where: {
        OR: [{ clerkOrganizationId: orgId }, { clerkUserId: userId }, { businessName: "Graft Agency Test" }],
      },
    });
    delete process.env.CLERK_WEBHOOK_BOOTSTRAP_PLATFORM;
  });

  it("skips organization.created when bootstrap is disabled", async () => {
    const result = await applyClerkOrganizationWebhook("organization.created", {
      id: orgId,
      name: "Acme Ltd",
    });
    expect(result).toEqual({ handled: true, action: "skipped", eventType: "organization.created" });
  });

  it("provisions a Client on organizationMembership.created", async () => {
    const result = await applyClerkOrganizationWebhook("organizationMembership.created", {
      organization: { id: orgId },
      public_user_data: {
        user_id: userId,
        first_name: "Test",
        last_name: "User",
        identifier: "test@example.com",
      },
    });

    expect(result).toEqual({ handled: true, action: "upserted", eventType: "organizationMembership.created" });

    const client = await prisma.client.findUnique({ where: { clerkUserId: userId } });
    expect(client).not.toBeNull();
    expect(client?.businessName).toBe("Test User");
  });

  it("soft-deletes Client on organizationMembership.deleted", async () => {
    await prisma.client.create({
      data: {
        clerkUserId: userId,
        businessName: "To Delete",
        clerkOrganizationId: orgId,
      },
    });

    const result = await applyClerkOrganizationWebhook("organizationMembership.deleted", {
      public_user_data: { user_id: userId },
    });

    expect(result).toEqual({ handled: true, action: "soft_deleted", eventType: "organizationMembership.deleted" });

    const client = await prisma.client.findUnique({ where: { clerkUserId: userId } });
    expect(client?.deletedAt).not.toBeNull();
  });

  it("sets isPlatformOwner when bootstrap is enabled and NO platform row exists", async () => {
    process.env.CLERK_WEBHOOK_BOOTSTRAP_PLATFORM = "true";

    // Temporarily rename/mark other platform owners so count is 0
    await prisma.client.updateMany({
      where: { isPlatformOwner: true },
      data: { isPlatformOwner: false, industry: "TEMP_HIDDEN_OWNER" },
    });

    try {
      const result = await applyClerkOrganizationWebhook("organization.created", {
        id: orgId,
        name: "Graft Agency Test",
      });

      expect(result).toEqual({ handled: true, action: "upserted", eventType: "organization.created" });

      const client = await prisma.client.findUnique({ where: { clerkOrganizationId: orgId } });
      expect(client?.isPlatformOwner).toBe(true);
    } finally {
      // Restore
      await prisma.client.updateMany({
        where: { industry: "TEMP_HIDDEN_OWNER" },
        data: { isPlatformOwner: true, industry: null },
      });
    }
  });
});
