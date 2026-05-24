import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/db/prisma";

const mockRequirePlatformAccess = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/auth/resolve-client", () => ({
  requirePlatformAccess: () => mockRequirePlatformAccess(),
}));
vi.mock("@/lib/inngest/client", () => ({
  inngest: {
    send: vi.fn().mockResolvedValue({}),
  },
}));

describe("leads API (approve)", () => {
  let clientId: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    const client = await prisma.client.create({
      data: {
        clerkOrganizationId: `test-org-approve-${Date.now()}`,
        businessName: "Test Client Approve",
      },
    });
    clientId = client.id;
    mockRequirePlatformAccess.mockResolvedValue({ clientId });
  });

  afterEach(async () => {
    await prisma.productSpec.deleteMany({ where: { clientId } });
    await prisma.lead.deleteMany({ where: { clientId } });
    await prisma.client.delete({ where: { id: clientId } });
  });

  it("resets inngestRunStatus and clears errors when approving lead", async () => {
    const lead = await prisma.lead.create({
      data: {
        clientId,
        customerName: "Prospect Co",
        source: "OUTBOUND_PROSPECT",
        status: "DRAFT_PENDING",
      },
    });

    // Create a product spec with completed inngestRunStatus and pre-existing errors
    await prisma.productSpec.create({
      data: {
        leadId: lead.id,
        clientId,
        stage: "PENDING",
        inngestRunStatus: "Completed",
        inngestRunId: "run-123",
        errorMessage: "Old Error",
        failureReason: "Old Reason",
      },
    });

    const { POST } = await import("@/app/api/leads/[id]/approve/route");
    const response = await POST(new Request("http://localhost/api/leads/123", { method: "POST" }), {
      params: Promise.resolve({ id: lead.id }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);

    const updatedSpec = await prisma.productSpec.findUnique({
      where: { leadId: lead.id },
    });

    expect(updatedSpec?.stage).toBe("PENDING");
    expect(updatedSpec?.inngestRunStatus).toBeNull();
    expect(updatedSpec?.inngestRunId).toBeNull();
    expect(updatedSpec?.errorMessage).toBeNull();
    expect(updatedSpec?.failureReason).toBeNull();
    expect(updatedSpec?.failureSource).toBeNull();
    expect(updatedSpec?.failedStage).toBeNull();
    expect(updatedSpec?.failedAt).toBeNull();
  });
});
