import { afterEach, describe, expect, it, vi } from "vitest";

import { updateRenderServiceBranch } from "@/lib/services/render.service";

describe("updateRenderServiceBranch", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("PATCHes Render with branch", async () => {
    vi.stubEnv("RENDER_API_KEY", "rk_test");
    vi.stubEnv("RENDER_OWNER_ID", "own_test");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    await updateRenderServiceBranch("srv_abc", "feat/demo-branch");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.render.com/v1/services/srv_abc");
    expect(init.method).toBe("PATCH");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer rk_test",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(init.body as string)).toEqual({ branch: "feat/demo-branch" });
  });
});
