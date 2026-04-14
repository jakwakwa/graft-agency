import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/db/prisma";
import { applyClerkOrganizationWebhook } from "@/lib/webhooks/clerk-organizations";

describe("applyClerkOrganizationWebhook", () => {
  const orgId = `test-clerk-webhook-org-${Date.now()}`;

  afterEach(async () => {
    await prisma.client.deleteMany({ where: { clerkOrganizationId: orgId } });
    vi.unstubAllEnvs();
  });

  it("creates a Client on organization.created", async () => {
    const result = await applyClerkOrganizationWebhook("organization.created", {
      id: orgId,
      name: "Acme Ltd",
    });
    expect(result).toEqual({ handled: true, action: "upserted", eventType: "organization.created" });

    const row = await prisma.client.findUnique({ where: { clerkOrganizationId: orgId } });
    expect(row?.businessName).toBe("Acme Ltd");
    expect(row?.isPlatformOwner).toBe(false);
  });

  it("updates businessName on organization.updated", async () => {
    await prisma.client.create({
      data: { clerkOrganizationId: orgId, businessName: "Old Name" },
    });

    const result = await applyClerkOrganizationWebhook("organization.updated", {
      id: orgId,
      name: "New Name",
    });
    expect(result).toEqual({ handled: true, action: "upserted", eventType: "organization.updated" });

    const row = await prisma.client.findUnique({ where: { clerkOrganizationId: orgId } });
    expect(row?.businessName).toBe("New Name");
  });

  it("soft-deletes Client on organization.deleted", async () => {
    await prisma.client.create({
      data: { clerkOrganizationId: orgId, businessName: "To Delete" },
    });

    const result = await applyClerkOrganizationWebhook("organization.deleted", { id: orgId });
    expect(result).toEqual({ handled: true, action: "soft_deleted", eventType: "organization.deleted" });

    const row = await prisma.client.findUnique({ where: { clerkOrganizationId: orgId } });
    expect(row?.deletedAt).toBeInstanceOf(Date);
  });

  it("is idempotent when organization.deleted fires for an already-deleted org", async () => {
    const deletedAt = new Date(Date.now() - 1000);
    await prisma.client.create({
      data: { clerkOrganizationId: orgId, businessName: "Already Gone", deletedAt },
    });

    const result = await applyClerkOrganizationWebhook("organization.deleted", { id: orgId });
    expect(result).toEqual({ handled: true, action: "soft_deleted", eventType: "organization.deleted" });

    const row = await prisma.client.findUnique({ where: { clerkOrganizationId: orgId } });
    // deletedAt should be unchanged (updateMany where clause filters it out)
    expect(row?.deletedAt?.getTime()).toBe(deletedAt.getTime());
  });

  it("ignores unrelated event types", async () => {
    const result = await applyClerkOrganizationWebhook("user.created", { id: "user_1" });
    expect(result).toEqual({ handled: false, eventType: "user.created" });
  });

  it("sets isPlatformOwner when bootstrap is enabled and no platform row exists yet", async () => {
    vi.stubEnv("CLERK_WEBHOOK_BOOTSTRAP_PLATFORM", "true");
    const unique = `test-clerk-webhook-platform-${Date.now()}`;
    const secondId = `${unique}-b`;
    const origCount = prisma.client.count.bind(prisma.client);
    let countCalls = 0;
    const countSpy = vi.spyOn(prisma.client, "count").mockImplementation((args) => {
      countCalls += 1;
      if (countCalls === 1) return Promise.resolve(0);
      return origCount(args);
    });

    try {
      const first = await applyClerkOrganizationWebhook("organization.created", {
        id: unique,
        name: "First Org",
      });
      expect(first.handled).toBe(true);
      const row = await prisma.client.findUnique({ where: { clerkOrganizationId: unique } });
      expect(row?.isPlatformOwner).toBe(true);

      await applyClerkOrganizationWebhook("organization.created", {
        id: secondId,
        name: "Second Org",
      });
      const second = await prisma.client.findUnique({ where: { clerkOrganizationId: secondId } });
      expect(second?.isPlatformOwner).toBe(false);
    } finally {
      countSpy.mockRestore();
      await prisma.client.deleteMany({ where: { clerkOrganizationId: { in: [unique, secondId] } } });
    }
  });
});
