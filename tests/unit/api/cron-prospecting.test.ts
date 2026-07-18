import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { runProspectingScheduledJob } = vi.hoisted(() => ({
  runProspectingScheduledJob: vi.fn(),
}));

vi.mock("@/lib/services/prospecting-scheduler.service", () => ({
  runProspectingScheduledJob,
}));
vi.mock("@/lib/auth/resolve-client", () => ({
  getPlatformClientId: vi.fn().mockResolvedValue("platform-client-id"),
}));

describe("GET /api/cron/prospecting", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 401 when Authorization header is missing", async () => {
    process.env.CRON_SECRET = "test-secret-123";
    const { GET } = await import("@/app/api/cron/prospecting/route");
    const response = await GET(new Request("http://localhost/api/cron/prospecting"));
    expect(response.status).toBe(401);
    expect(runProspectingScheduledJob).not.toHaveBeenCalled();
  });

  it("returns 401 when Bearer token does not match CRON_SECRET", async () => {
    process.env.CRON_SECRET = "test-secret-123";
    const { GET } = await import("@/app/api/cron/prospecting/route");
    const response = await GET(
      new Request("http://localhost/api/cron/prospecting", {
        headers: { Authorization: "Bearer wrong-token" },
      }),
    );
    expect(response.status).toBe(401);
    expect(runProspectingScheduledJob).not.toHaveBeenCalled();
  });

  it("returns 500 when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    const { GET } = await import("@/app/api/cron/prospecting/route");
    const response = await GET(
      new Request("http://localhost/api/cron/prospecting", {
        headers: { Authorization: "Bearer any" },
      }),
    );
    expect(response.status).toBe(500);
    expect(runProspectingScheduledJob).not.toHaveBeenCalled();
  });

  it("returns 200 with result when the scheduler runs work", async () => {
    process.env.CRON_SECRET = "test-secret-123";
    runProspectingScheduledJob.mockResolvedValue({
      status: "ok",
      result: { added: 3, duplicates: 0, errors: 0 },
    });
    const { GET } = await import("@/app/api/cron/prospecting/route");
    const response = await GET(
      new Request("http://localhost/api/cron/prospecting", {
        headers: { Authorization: "Bearer test-secret-123" },
      }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ added: 3, duplicates: 0, errors: 0 });
    expect(runProspectingScheduledJob).toHaveBeenCalledOnce();
  });

  it("returns 200 with skip message when outside window", async () => {
    process.env.CRON_SECRET = "test-secret-123";
    runProspectingScheduledJob.mockResolvedValue({
      status: "skipped",
      reason: "Cron: outside configured UTC time window",
    });
    const { GET } = await import("@/app/api/cron/prospecting/route");
    const response = await GET(
      new Request("http://localhost/api/cron/prospecting", {
        headers: { Authorization: "Bearer test-secret-123" },
      }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ message: "Cron: outside configured UTC time window" });
  });

  it("returns 200 when already ran for this period", async () => {
    process.env.CRON_SECRET = "test-secret-123";
    runProspectingScheduledJob.mockResolvedValue({
      status: "skipped",
      reason: "Cron: already ran for this period",
    });
    const { GET } = await import("@/app/api/cron/prospecting/route");
    const response = await GET(
      new Request("http://localhost/api/cron/prospecting", {
        headers: { Authorization: "Bearer test-secret-123" },
      }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ message: "Cron: already ran for this period" });
  });
});
