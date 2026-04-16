import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindMany, mockUpdate, mockAssertCompanyRecord, mockAssertPersonRecord, mockAddToList } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockUpdate: vi.fn(),
  mockAssertCompanyRecord: vi.fn(),
  mockAssertPersonRecord: vi.fn(),
  mockAddToList: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  default: {
    prospectQueue: {
      findMany: mockFindMany,
      update: mockUpdate,
    },
  },
}));

vi.mock("@/lib/services/attio.service", () => ({
  attioService: {
    assertCompanyRecord: mockAssertCompanyRecord,
    assertPersonRecord: mockAssertPersonRecord,
    addToList: mockAddToList,
  },
}));

describe("extractRootDomain", () => {
  it("normalises full URLs to root domain", async () => {
    const { extractRootDomain } = await import("@/lib/services/attio-prospect-queue-sync.service");
    expect(extractRootDomain("https://www.Example.com/about")).toBe("example.com");
  });
});

describe("attioProspectQueueSyncService.processPendingQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddToList.mockResolvedValue({ entryId: "entry-1" });
  });

  it("completes queue item when company and person asserts succeed", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "queue-1",
        businessName: "Acme Ltd",
        websiteUrl: "https://www.acme.com",
        lead: { email: "founder@acme.com" },
      },
    ]);
    mockAssertCompanyRecord.mockResolvedValue({ ok: true, data: { recordId: "company-1" } });
    mockAssertPersonRecord.mockResolvedValue({ ok: true, data: { recordId: "person-1" } });

    const { attioProspectQueueSyncService } = await import("@/lib/services/attio-prospect-queue-sync.service");
    const result = await attioProspectQueueSyncService.processPendingQueue({ clientId: "client-1" });

    expect(mockAssertCompanyRecord).toHaveBeenCalledWith({
      values: {
        name: [{ value: "Acme Ltd" }],
        domains: [{ domain: "acme.com" }],
      },
    });
    expect(mockAssertPersonRecord).toHaveBeenCalledWith({
      values: {
        email_addresses: [{ email_address: "founder@acme.com" }],
        company: [{ target_record_id: "company-1" }],
      },
    });
    expect(result).toMatchObject({ processed: 1, completed: 1, failed: 0, skipped: 0 });
  });

  it("marks queue as failed when company assert fails", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "queue-2",
        businessName: "Broken Co",
        websiteUrl: "https://broken.io",
        lead: { email: "hello@broken.io" },
      },
    ]);
    mockAssertCompanyRecord.mockResolvedValue({ ok: false, error: "Attio company assert failed" });

    const { attioProspectQueueSyncService } = await import("@/lib/services/attio-prospect-queue-sync.service");
    const result = await attioProspectQueueSyncService.processPendingQueue({ clientId: "client-1" });

    expect(mockAssertPersonRecord).not.toHaveBeenCalled();
    expect(result).toMatchObject({ processed: 1, completed: 0, failed: 1, skipped: 0 });
    expect(result.diagnostics[0]?.message).toContain("Attio company assert failed");
  });

  it("asserts person when website is invalid but email exists", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "queue-3",
        businessName: "Email Only",
        websiteUrl: "",
        lead: { email: "person@email-only.com" },
      },
    ]);
    mockAssertPersonRecord.mockResolvedValue({ ok: true, data: { recordId: "person-2" } });

    const { attioProspectQueueSyncService } = await import("@/lib/services/attio-prospect-queue-sync.service");
    const result = await attioProspectQueueSyncService.processPendingQueue({ clientId: "client-1" });

    expect(mockAssertCompanyRecord).not.toHaveBeenCalled();
    expect(mockAddToList).not.toHaveBeenCalled();
    expect(mockAssertPersonRecord).toHaveBeenCalledWith({
      values: {
        email_addresses: [{ email_address: "person@email-only.com" }],
      },
    });
    expect(result).toMatchObject({ processed: 1, completed: 1, failed: 0, skipped: 0 });
  });

  it("completes with company-only sync when lead email is missing", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "queue-4",
        businessName: "Company Only",
        websiteUrl: "https://company-only.com",
        lead: { email: null },
      },
    ]);
    mockAssertCompanyRecord.mockResolvedValue({ ok: true, data: { recordId: "company-4" } });

    const { attioProspectQueueSyncService } = await import("@/lib/services/attio-prospect-queue-sync.service");
    const result = await attioProspectQueueSyncService.processPendingQueue({ clientId: "client-1" });

    expect(mockAssertCompanyRecord).toHaveBeenCalledTimes(1);
    expect(mockAddToList).toHaveBeenCalledWith({ recordId: "company-4" });
    expect(mockAssertPersonRecord).not.toHaveBeenCalled();
    expect(result).toMatchObject({ processed: 1, completed: 1, failed: 0, skipped: 0 });
  });

  it("calls addToList after company assert and before person assert", async () => {
    const callOrder: string[] = [];
    mockFindMany.mockResolvedValue([
      {
        id: "queue-5",
        businessName: "Ordered Corp",
        websiteUrl: "https://ordered.com",
        lead: { email: "ceo@ordered.com" },
      },
    ]);
    mockAssertCompanyRecord.mockImplementation(async () => {
      callOrder.push("assertCompany");
      return { ok: true, data: { recordId: "company-5" } };
    });
    mockAddToList.mockImplementation(async () => {
      callOrder.push("addToList");
      return { entryId: "entry-5" };
    });
    mockAssertPersonRecord.mockImplementation(async () => {
      callOrder.push("assertPerson");
      return { ok: true, data: { recordId: "person-5" } };
    });

    const { attioProspectQueueSyncService } = await import("@/lib/services/attio-prospect-queue-sync.service");
    const result = await attioProspectQueueSyncService.processPendingQueue({ clientId: "client-1" });

    expect(callOrder).toEqual(["assertCompany", "addToList", "assertPerson"]);
    expect(mockAddToList).toHaveBeenCalledWith({ recordId: "company-5" });
    expect(result).toMatchObject({ processed: 1, completed: 1, failed: 0 });
  });

  it("marks queue as failed when list sync fails and skips person assert", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "queue-6",
        businessName: "List Fail Corp",
        websiteUrl: "https://listfail.com",
        lead: { email: "ops@listfail.com" },
      },
    ]);
    mockAssertCompanyRecord.mockResolvedValue({ ok: true, data: { recordId: "company-6" } });
    mockAddToList.mockResolvedValue({ error: "ATTIO_LIST_ID is not configured" });

    const { attioProspectQueueSyncService } = await import("@/lib/services/attio-prospect-queue-sync.service");
    const result = await attioProspectQueueSyncService.processPendingQueue({ clientId: "client-1" });

    expect(mockAssertPersonRecord).not.toHaveBeenCalled();
    expect(result).toMatchObject({ processed: 1, completed: 0, failed: 1, skipped: 0 });
    expect(result.diagnostics[0]?.message).toContain("ATTIO_LIST_ID is not configured");
  });
});
