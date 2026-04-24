import { afterEach, describe, expect, it, vi } from "vitest";

import { provisionRenderService } from "@/lib/services/render.service";

describe("provisionRenderService", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("strips surrounding quotes from RENDER_OWNER_ID in provision body", async () => {
    vi.stubEnv("RENDER_API_KEY", "rk_test");
    vi.stubEnv("RENDER_OWNER_ID", '"tea-quoted"');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "srv_new" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await provisionRenderService({
      companySlug: "acme",
      julesRepoSource: "sources/github/org/repo",
      rootDir: "prospects/acme",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(parsed.ownerId).toBe("tea-quoted");
    expect(parsed.serviceDetails).toEqual({
      runtime: "node",
      plan: "free",
      envSpecificDetails: {
        buildCommand: "npm install && npm run build",
        startCommand: "npm start",
      },
    });
    expect(parsed).not.toHaveProperty("webServiceDetails");
  });
});
