import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  approveJulesPlan,
  createJulesSession,
  extractPullRequestUrlFromSession,
  getJulesSession,
} from "@/lib/services/jules-github.service";

const mockFetch = vi.fn();

beforeEach(() => {
  process.env.JULES_API_KEY = "test-key";
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

describe("jules-github service", () => {
  it("createJulesSession returns session details", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "12345",
        name: "sessions/12345",
        url: "https://jules.google.com/session/12345",
        state: "QUEUED",
      }),
    });

    const result = await createJulesSession({
      repoSource: "sources/github/jakwakwa/graft-today-jules",
      startingBranch: "main",
      title: "Build prototype: Acme Corp",
      prompt: "Build a landing page",
    });

    expect(result.sessionId).toBe("12345");
    expect(result.sessionUrl).toContain("jules.google.com");
    expect(result.state).toBe("QUEUED");

    const call = mockFetch.mock.calls[0];
    expect(call).toBeDefined();
    if (!call) throw new Error("Expected fetch call");
    expect(call[0]).toContain("/sessions");
    const body = JSON.parse(call[1].body);
    expect(body.sourceContext.source).toBe("sources/github/jakwakwa/graft-today-jules");
    expect(body.sourceContext.githubRepoContext.startingBranch).toBe("main");
    expect(body.automationMode).toBe("AUTO_CREATE_PR");
  });

  it("getJulesSession returns current state", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "12345",
        url: "https://jules.google.com/session/12345",
        state: "IN_PROGRESS",
      }),
    });

    const result = await getJulesSession("12345");
    expect(result.state).toBe("IN_PROGRESS");
    expect(result.sessionId).toBe("12345");
  });

  it("createJulesSession throws on API error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Invalid argument" } }),
    });

    await expect(
      createJulesSession({
        repoSource: "sources/github/jakwakwa/bad-repo",
        startingBranch: "main",
        title: "Test",
        prompt: "Test prompt",
      }),
    ).rejects.toThrow("Jules session creation failed");
  });

  it("approveJulesPlan posts to approve endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await approveJulesPlan("session-123");
    const call = mockFetch.mock.calls[0];
    expect(call).toBeDefined();
    if (!call) throw new Error("Expected fetch call");
    expect(call[0]).toContain("/sessions/session-123:approvePlan");
    expect(call[1].method).toBe("POST");
  });

  it("extractPullRequestUrlFromSession returns PR output URL", () => {
    const url = extractPullRequestUrlFromSession({
      outputs: [{ pullRequest: { url: "https://github.com/acme/repo/pull/42" } }],
    });
    expect(url).toBe("https://github.com/acme/repo/pull/42");
  });
});
