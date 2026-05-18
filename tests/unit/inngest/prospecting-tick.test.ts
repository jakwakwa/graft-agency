import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetPlatformClientId = vi.fn();
const mockRunProspectingScheduledJob = vi.fn();

vi.mock("@/lib/auth/resolve-client", () => ({
  getPlatformClientId: mockGetPlatformClientId,
}));

vi.mock("@/lib/services/prospecting-scheduler.service", () => ({
  runProspectingScheduledJob: mockRunProspectingScheduledJob,
}));

describe("runProspectingInngestStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns skipped when platform client is missing", async () => {
    mockGetPlatformClientId.mockResolvedValue(null);
    const { runProspectingInngestStep } = await import("@/lib/inngest/functions/prospecting-tick");
    const out = await runProspectingInngestStep();
    expect(out).toEqual({ skipped: true, reason: "Platform client not found" });
    expect(mockRunProspectingScheduledJob).not.toHaveBeenCalled();
  });

  it("maps scheduler ok outcome", async () => {
    mockGetPlatformClientId.mockResolvedValue("cid-1");
    mockRunProspectingScheduledJob.mockResolvedValue({
      status: "ok",
      result: { added: 2, duplicates: 0, errors: 0 },
    });
    const { runProspectingInngestStep } = await import("@/lib/inngest/functions/prospecting-tick");
    const out = await runProspectingInngestStep();
    expect(out).toEqual({ ok: true, result: { added: 2, duplicates: 0, errors: 0 } });
  });

  it("maps scheduler skipped outcome", async () => {
    mockGetPlatformClientId.mockResolvedValue("cid-1");
    mockRunProspectingScheduledJob.mockResolvedValue({
      status: "skipped",
      reason: "Cron disabled",
    });
    const { runProspectingInngestStep } = await import("@/lib/inngest/functions/prospecting-tick");
    const out = await runProspectingInngestStep();
    expect(out).toEqual({ skipped: true, reason: "Cron disabled" });
  });

  it("maps scheduler error outcome", async () => {
    mockGetPlatformClientId.mockResolvedValue("cid-1");
    mockRunProspectingScheduledJob.mockResolvedValue({
      status: "error",
      message: "boom",
    });
    const { runProspectingInngestStep } = await import("@/lib/inngest/functions/prospecting-tick");
    const out = await runProspectingInngestStep();
    expect(out).toEqual({ error: true, message: "boom" });
  });
  it("propagates unexpected errors from the scheduler", async () => {
    mockGetPlatformClientId.mockResolvedValue("cid-1");
    mockRunProspectingScheduledJob.mockRejectedValue(new Error("Unexpected DB failure"));
    const { runProspectingInngestStep } = await import("@/lib/inngest/functions/prospecting-tick");

    await expect(runProspectingInngestStep()).rejects.toThrow("Unexpected DB failure");
  });

});
