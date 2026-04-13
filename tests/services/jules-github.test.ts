import { describe, it, expect, vi } from "vitest";
import { createBuildRepo, createJulesIssue, type BuildRepoResult } from "@/lib/services/jules-github.service";

vi.mock("@octokit/rest", () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    repos: {
      createUsingTemplate: vi.fn().mockResolvedValue({
        data: { full_name: "graft-today-builds/acme-plumbing-abc123", html_url: "https://github.com/graft-today-builds/acme-plumbing-abc123", clone_url: "https://github.com/graft-today-builds/acme-plumbing-abc123.git" },
      }),
    },
    issues: {
      create: vi.fn().mockResolvedValue({
        data: { html_url: "https://github.com/graft-today-builds/acme-plumbing-abc123/issues/1", number: 1 },
      }),
    },
  })),
}));

describe("jules-github service", () => {
  it("createBuildRepo returns repo details", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    const result = await createBuildRepo({ companySlug: "acme-plumbing", buildId: "abc123" });
    expect(result.repoFullName).toBe("graft-today-builds/acme-plumbing-abc123");
    expect(result.htmlUrl).toContain("github.com");
  });

  it("createJulesIssue returns issue URL", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    const issueUrl = await createJulesIssue({
      repoFullName: "graft-today-builds/acme-plumbing-abc123",
      prdContent: "# PRD: Acme Booking Portal\n\n...",
      designDescription: "Clean Professional — white background, blue accents",
    });
    expect(issueUrl).toContain("github.com");
    expect(issueUrl).toContain("issues");
  });
});
