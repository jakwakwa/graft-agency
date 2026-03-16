import { describe, expect, it } from "vitest";
import prisma from "@/lib/db/prisma";

/**
 * Step 02 (Types & DB + Contract): Tests that define the ProspectQueue schema contract.
 * Requires: (a) DATABASE_URL in .env (loaded via tests/setup.ts dotenv/config),
 *           (b) Schema migration adding clientId and leadId to ProspectQueue.
 * Fails until migration is run.
 */
describe("ProspectQueue schema (clientId required)", () => {
  it("creates ProspectQueue with clientId and persists", async () => {
    const client = await prisma.client.create({
      data: {
        clerkOrganizationId: `test-org-${Date.now()}`,
        businessName: "Test Client",
      },
    });

    const queue = await prisma.prospectQueue.create({
      data: {
        clientId: client.id,
        businessName: "Test Business",
        websiteUrl: "https://example.com",
      },
    });

    expect(queue.clientId).toBe(client.id);

    const found = await prisma.prospectQueue.findMany({
      where: { clientId: client.id },
    });
    expect(found).toHaveLength(1);
    expect(found[0]?.id).toBe(queue.id);

    await prisma.prospectQueue.delete({ where: { id: queue.id } });
    await prisma.client.delete({ where: { id: client.id } });
  });

  it("creates ProspectQueue with leadId after Lead exists", async () => {
    const client = await prisma.client.create({
      data: {
        clerkOrganizationId: `test-org-lead-${Date.now()}`,
        businessName: "Test Client",
      },
    });

    const lead = await prisma.lead.create({
      data: {
        clientId: client.id,
        source: "OUTBOUND_PROSPECT",
      },
    });

    const queue = await prisma.prospectQueue.create({
      data: {
        clientId: client.id,
        leadId: lead.id,
        businessName: "Test Biz",
        websiteUrl: "https://example.com",
      },
    });

    expect(queue.leadId).toBe(lead.id);

    const withLead = await prisma.prospectQueue.findUnique({
      where: { id: queue.id },
      include: { lead: true },
    });
    expect(withLead?.lead?.id).toBe(lead.id);

    await prisma.prospectQueue.delete({ where: { id: queue.id } });
    await prisma.lead.delete({ where: { id: lead.id } });
    await prisma.client.delete({ where: { id: client.id } });
  });
});
