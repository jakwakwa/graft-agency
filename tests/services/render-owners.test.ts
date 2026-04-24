import { afterEach, describe, expect, it, vi } from "vitest";

import { listRenderOwners } from "@/lib/services/render.service";

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
});
