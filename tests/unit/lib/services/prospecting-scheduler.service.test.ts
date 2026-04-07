import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique, mockUpdate, mockFindAndAudit } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockFindAndAudit: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  default: {
    prospectingConfig: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

vi.mock("@/lib/services/gemini-prospecting.service", () => ({
  geminiProspectingService: { findAndAuditProspects: mockFindAndAudit },
}));

describe("runProspectingScheduledJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips when cron is disabled", async () => {
    mockFindUnique.mockResolvedValue({ cronEnabled: false });
    const { runProspectingScheduledJob } = await import("@/lib/services/prospecting-scheduler.service");
    const out = await runProspectingScheduledJob("client-1", new Date("2026-03-28T04:35:00.000Z"));
    expect(out).toEqual({ status: "skipped", reason: "Cron disabled" });
    expect(mockFindAndAudit).not.toHaveBeenCalled();
  });

  it("runs when schedule matches and updates last run", async () => {
    mockFindUnique.mockResolvedValue({
      cronEnabled: true,
      cronFrequency: "daily",
      cronDay: null,
      cronTime: "04:35",
      cronStartDate: null,
      lastCronRunAt: null,
      searchCriteria: { industries: ["x"], locations: [], keywords: [] },
      valueProposition: null,
    });
    mockFindAndAudit.mockResolvedValue({ created: 1, errors: 0 });
    mockUpdate.mockResolvedValue({});

    const { runProspectingScheduledJob } = await import("@/lib/services/prospecting-scheduler.service");
    const now = new Date("2026-03-28T04:35:00.000Z");
    const out = await runProspectingScheduledJob("client-1", now);
    expect(out.status).toBe("ok");
    if (out.status === "ok") expect(out.result).toEqual({ created: 1, errors: 0 });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { clientId: "client-1" },
      data: { lastCronRunAt: now },
    });
  });
});
