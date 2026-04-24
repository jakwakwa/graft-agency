import { afterEach, describe, expect, it, vi } from "vitest";

import { listRenderOwners, provisionRenderService } from "@/lib/services/render.service";

describe("listRenderOwners", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("parses wrapped owner array from Render", async () => {
    vi.stubEnv("RENDER_API_KEY", "rk_test");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ owner: { id: "tea_abc", name: "Acme", type: "team" } }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const owners = await listRenderOwners();

    expect(owners).toEqual([{ id: "tea_abc", name: "Acme", email: undefined, type: "team" }]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.render.com/v1/owners?limit=100",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer rk_test" }),
      }),
    );
  });

  it("parses { owners: [...] } pagination shape", async () => {
    vi.stubEnv("RENDER_API_KEY", "rk_test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          owners: [{ id: "usr_xyz", name: "You", email: "a@b.co" }],
        }),
      }),
    );

    const owners = await listRenderOwners();
    expect(owners).toEqual([{ id: "usr_xyz", name: "You", email: "a@b.co", type: undefined }]);
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
      envSpecificDetails: {
        buildCommand: "npm install && npm run build",
        startCommand: "npm start",
      },
    });
    expect(parsed).not.toHaveProperty("webServiceDetails");
  });

  it("on invalid ownerID 400, re-lists owners and appends diagnostic hint", async () => {
    vi.stubEnv("RENDER_API_KEY", "rk_test");
    vi.stubEnv("RENDER_OWNER_ID", "tea-bad");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'invalid ownerID: "tea-bad". use /v1/owners' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ owner: { id: "tea_ok", name: "Workspace", type: "team" } }],
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      provisionRenderService({
        companySlug: "acme",
        julesRepoSource: "sources/github/org/repo",
        rootDir: "prospects/acme",
      }),
    ).rejects.toThrow(/tea_ok/);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
