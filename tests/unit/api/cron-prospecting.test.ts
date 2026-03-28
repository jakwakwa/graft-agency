import { beforeEach, describe, expect, it, vi } from "vitest";

const findAndAuditProspects = vi.fn();

vi.mock("@/lib/services/gemini-prospecting.service", () => ({
  geminiProspectingService: { findAndAuditProspects },
}));

vi.mock("@/lib/db/prisma", () => ({
  default: {
    prospectingConfig: {
      findUnique: vi.fn().mockResolvedValue({
        cronEnabled: true,
        cronFrequency: "daily",
        cronDay: null,
        cronStartDate: null,
        searchCriteria: { industries: ["dental"], locations: ["Cape Town"], keywords: [] },
        valueProposition: null,
      }),
    },
  },
}));

vi.mock("@/lib/auth/resolve-client", () => ({
  getPlatformClientId: vi.fn().mockResolvedValue("client-123"),
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
    expect(findAndAuditProspects).not.toHaveBeenCalled();
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
    expect(findAndAuditProspects).not.toHaveBeenCalled();
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
    expect(findAndAuditProspects).not.toHaveBeenCalled();
  });

  it("returns 200 with created count when auth is valid", async () => {
    process.env.CRON_SECRET = "test-secret-123";
    findAndAuditProspects.mockResolvedValue({ created: 3, errors: 0 });
    const { GET } = await import("@/app/api/cron/prospecting/route");
    const response = await GET(
      new Request("http://localhost/api/cron/prospecting", {
        headers: { Authorization: "Bearer test-secret-123" },
      }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ created: 3, errors: 0 });
    expect(findAndAuditProspects).toHaveBeenCalledOnce();
  });
});
