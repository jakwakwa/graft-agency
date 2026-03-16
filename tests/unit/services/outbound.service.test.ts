import { beforeEach, describe, expect, it, vi } from "vitest";
import { processQueue } from "@/lib/services/outbound.service";

const { mockTxFindMany, mockTxUpdateMany, mockTxQueryRaw, mockUpdate } = vi.hoisted(() => ({
  mockTxFindMany: vi.fn(),
  mockTxUpdateMany: vi.fn(),
  mockTxQueryRaw: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  default: {
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        $queryRaw: mockTxQueryRaw,
        prospectQueue: { findMany: mockTxFindMany, updateMany: mockTxUpdateMany },
      }),
    ),
    prospectQueue: { update: mockUpdate },
  },
}));

vi.mock("@/lib/services/lead.service", () => ({
  leadService: {
    createFromOutbound: vi.fn().mockResolvedValue({ id: "lead-123" }),
  },
}));

describe("outbound.service processQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty message when queue has no PENDING items", async () => {
    mockTxQueryRaw.mockResolvedValue([]);
    mockTxFindMany.mockResolvedValue([]);

    const result = await processQueue();
    expect(result.processedCount).toBe(0);
    expect(result.message).toContain("Queue is empty");
  });

  it("processes PENDING items and creates DRAFT_PENDING leads", async () => {
    const mockItem = {
      id: "pq-1",
      clientId: "client-1",
      businessName: "Scrape Target",
      websiteUrl: "https://target.example.com",
      status: "PENDING",
    };
    mockTxQueryRaw.mockResolvedValue([{ id: mockItem.id }]);
    mockTxUpdateMany.mockResolvedValue({ count: 1 });
    mockTxFindMany.mockResolvedValue([mockItem]);
    mockUpdate.mockResolvedValue({ ...mockItem, status: "COMPLETED", leadId: "lead-123" });

    const result = await processQueue();
    expect(result.processedCount).toBe(1);
    expect(result.message).toContain("Processed 1");
  });
});
