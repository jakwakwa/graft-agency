import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  approveJulesPlan,
  createJulesSession,
  extractPullRequestUrlFromActivities,
  extractPullRequestUrlFromSession,
  fetchGithubPullRequestHeadRef,
  fetchLatestJulesProgressUpdate,
  getJulesSession,
  julesProgressToDbFields,
  parseGithubPullRequestFromUrl,
  pickLatestJulesProgressFromActivities,
  resolveJulesPullRequestUrl,
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

  it("extractPullRequestUrlFromSession reads SessionOutput union output.pullRequest", () => {
    const url = extractPullRequestUrlFromSession({
      outputs: [{ output: { pullRequest: { url: "https://github.com/acme/repo/pull/9" } } }],
    });
    expect(url).toBe("https://github.com/acme/repo/pull/9");
  });

  it("parseGithubPullRequestFromUrl parses owner repo number", () => {
    expect(parseGithubPullRequestFromUrl("https://github.com/jakwakwa/demo/pull/8")).toEqual({
      owner: "jakwakwa",
      repo: "demo",
      number: 8,
    });
    expect(parseGithubPullRequestFromUrl("not-a-url")).toBeNull();
  });

  it("extractPullRequestUrlFromActivities finds URL in activity JSON", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        activities: [
          {
            agentMessaged: {
              agentMessage: "Opened https://github.com/acme/repo/pull/99 for review.",
            },
          },
        ],
      }),
    });
    const url = await extractPullRequestUrlFromActivities("sess-99");
    expect(url).toBe("https://github.com/acme/repo/pull/99");
  });

  it("resolveJulesPullRequestUrl returns session output without calling GitHub when present", async () => {
    delete process.env.GITHUB_TOKEN;
    const url = await resolveJulesPullRequestUrl({
      raw: {
        outputs: [{ pullRequest: { url: "https://github.com/acme/repo/pull/1" } }],
      },
      sessionId: "ignored",
      githubRepo: "sources/github/acme/repo",
    });
    expect(url).toBe("https://github.com/acme/repo/pull/1");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("pickLatestJulesProgressFromActivities returns null when empty", () => {
    expect(pickLatestJulesProgressFromActivities([])).toBeNull();
  });

  it("pickLatestJulesProgressFromActivities picks newest by createTime", () => {
    const activities: Record<string, unknown>[] = [
      {
        createTime: "2024-01-15T10:00:00Z",
        progressUpdated: { title: "Older", description: "First" },
      },
      {
        createTime: "2024-01-15T11:00:00Z",
        progressUpdated: { title: "Newer", description: "Second" },
      },
    ];
    const p = pickLatestJulesProgressFromActivities(activities);
    expect(p?.title).toBe("Newer");
    expect(p?.description).toBe("Second");
  });

  it("julesProgressToDbFields clears blank strings", () => {
    expect(julesProgressToDbFields(null)).toEqual({
      julesProgressTitle: null,
      julesProgressDescription: null,
    });
    expect(
      julesProgressToDbFields({
        title: "  Hello  ",
        description: "   ",
      }),
    ).toEqual({ julesProgressTitle: "Hello", julesProgressDescription: null });
  });

  it("fetchLatestJulesProgressUpdate parses activities list", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        activities: [
          {
            createTime: "2024-01-15T12:00:00Z",
            progressUpdated: { title: "Writing tests", description: "Adding coverage" },
          },
        ],
      }),
    });
    const p = await fetchLatestJulesProgressUpdate("sess-1");
    expect(p?.title).toBe("Writing tests");
    expect(p?.description).toBe("Adding coverage");
    const call = mockFetch.mock.calls[0];
    expect(call).toBeDefined();
    if (!call) throw new Error("Expected fetch call");
    expect(String(call[0])).toContain("/sessions/sess-1/activities");
  });

  it("fetchGithubPullRequestHeadRef returns head.ref", async () => {
    process.env.GITHUB_TOKEN = "ghp_test";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ head: { ref: "feat/prospect-landing-page-123" } }),
    });

    const ref = await fetchGithubPullRequestHeadRef({
      owner: "jakwakwa",
      repo: "graft-today-engagement-demo-builds",
      number: 42,
    });

    expect(ref).toBe("feat/prospect-landing-page-123");
    const call = mockFetch.mock.calls[0];
    expect(call).toBeDefined();
    if (!call) throw new Error("Expected fetch call");
    expect(String(call[0])).toBe("https://api.github.com/repos/jakwakwa/graft-today-engagement-demo-builds/pulls/42");
  });
});
