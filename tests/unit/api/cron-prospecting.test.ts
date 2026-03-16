import { beforeEach, describe, expect, it, vi } from "vitest";

const processQueue = vi.fn();

vi.mock("@/lib/services/outbound.service", () => ({
  processQueue,
}));

describe("GET /api/cron/prospecting", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it("returns 401 when Authorization header is missing", async () => {
    process.env.CRON_SECRET = "test-secret-123";
    const { GET } = await import("@/app/api/cron/prospecting/route");
    const response = await GET(new Request("http://localhost/api/cron/prospecting"));
    expect(response.status).toBe(401);
    expect(processQueue).not.toHaveBeenCalled();
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
    expect(processQueue).not.toHaveBeenCalled();
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
    expect(processQueue).not.toHaveBeenCalled();
  });

  it("returns 200 with processedCount when auth is valid and queue has items", async () => {
    process.env.CRON_SECRET = "test-secret-123";
    processQueue.mockResolvedValue({ processedCount: 2, message: "Processed 2 of 2 prospects." });
    const { GET } = await import("@/app/api/cron/prospecting/route");
    const response = await GET(
      new Request("http://localhost/api/cron/prospecting", {
        headers: { Authorization: "Bearer test-secret-123" },
      }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ processedCount: 2, message: "Processed 2 of 2 prospects." });
    expect(processQueue).toHaveBeenCalledOnce();
  });

  it("returns 200 with empty message when queue is empty", async () => {
    process.env.CRON_SECRET = "test-secret-123";
    processQueue.mockResolvedValue({
      processedCount: 0,
      message: "Queue is empty. No prospects to process.",
    });
    const { GET } = await import("@/app/api/cron/prospecting/route");
    const response = await GET(
      new Request("http://localhost/api/cron/prospecting", {
        headers: { Authorization: "Bearer test-secret-123" },
      }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.processedCount).toBe(0);
    expect(json.message).toContain("Queue is empty");
  });
});
