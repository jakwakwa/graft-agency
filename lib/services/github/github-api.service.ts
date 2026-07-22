// ------------------------------------------------------------- GitHub helpers ---

export function parseGithubRepoFromJulesSource(source: string): { owner: string; repo: string } | null {
  const m = source.match(/^sources\/github\/([^/]+)\/([^/]+)$/);
  if (!m) return null;
  const owner = m[1];
  const repo = m[2];
  if (!owner || !repo) return null;
  return { owner, repo };
}

/**
 * Find the most likely PR for a Jules session by matching session id in PR body/branch,
 * else falling back to the newest Jules-style PR.
 */
export async function findJulesPullRequest(params: {
  owner: string;
  repo: string;
  sessionId: string;
}): Promise<{ htmlUrl: string; number: number; headBranch: string; state: string; merged: boolean } | null> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) return null;

  // Prefer recently-updated PRs — Jules often updates an existing open PR rather than the newest-by-created.
  const url = `https://api.github.com/repos/${params.owner}/${params.repo}/pulls?state=all&sort=updated&direction=desc&per_page=50`;
  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!r.ok) return null;

  const prs = (await r.json()) as Array<{
    html_url: string;
    number: number;
    title: string;
    body: string | null;
    state: string;
    merged_at: string | null;
    head: { ref: string };
  }>;

  const refHints = (ref: string) => {
    const r = ref.toLowerCase();
    return {
      hasJules: r.includes("jules"),
      hasFeat: r.startsWith("feat/") || r.startsWith("feat-") || r.includes("/feat-") || r.includes("feat:"),
    };
  };

  const titleLower = (t: string) => t.toLowerCase();

  const match =
    prs.find((p) => (p.body ?? "").includes(params.sessionId) || p.head.ref.includes(params.sessionId)) ??
    prs.find((p) => {
      const h = refHints(p.head.ref);
      return h.hasJules || h.hasFeat;
    }) ??
    prs.find(
      (p) =>
        titleLower(p.title).includes("prospect") &&
        (titleLower(p.title).includes("landing") || titleLower(p.title).includes("page")),
    );

  if (!match) return null;
  return {
    htmlUrl: match.html_url,
    number: match.number,
    headBranch: match.head.ref,
    state: match.state,
    merged: Boolean(match.merged_at),
  };
}

/**
 * Scan PR comments for a Render preview URL (Render posts them on PR open).
 */
/** GitHub PR head ref for Render deploy branch (Jules lands on PR branch before merge). */
export async function fetchGithubPullRequestHeadRef(params: {
  owner: string;
  repo: string;
  number: number;
}): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) return null;

  const url = `https://api.github.com/repos/${params.owner}/${params.repo}/pulls/${params.number}`;
  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!r.ok) return null;
  const body = (await r.json()) as { head?: { ref?: string } };
  const ref = body.head?.ref;
  return typeof ref === "string" && ref.length > 0 ? ref : null;
}

/** Commit SHA for the head of a PR — needed to post a GitHub commit status. */
export async function fetchGithubPullRequestHeadSha(params: {
  owner: string;
  repo: string;
  number: number;
}): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) return null;

  const url = `https://api.github.com/repos/${params.owner}/${params.repo}/pulls/${params.number}`;
  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!r.ok) return null;
  const body = (await r.json()) as { head?: { sha?: string } };
  const sha = body.head?.sha;
  return typeof sha === "string" && sha.length > 0 ? sha : null;
}

/**
 * Post a GitHub commit status so Jules CI-listen can see Render deploy outcomes.
 * Uses the legacy Commit Status API (POST /repos/:owner/:repo/statuses/:sha)
 * which only requires a PAT with `repo` scope — no GitHub App needed.
 *
 * Throws on API errors so Inngest retries surface failures rather than swallowing them.
 */
export async function postGithubCommitStatus(params: {
  owner: string;
  repo: string;
  sha: string;
  state: "pending" | "success" | "failure" | "error";
  context: string;
  description: string;
  targetUrl?: string;
}): Promise<void> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) throw new Error("GITHUB_TOKEN is not set — cannot post commit status to GitHub");

  const r = await fetch(`https://api.github.com/repos/${params.owner}/${params.repo}/statuses/${params.sha}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      state: params.state,
      context: params.context,
      description: params.description,
      ...(params.targetUrl ? { target_url: params.targetUrl } : {}),
    }),
  });

  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(`GitHub commit status POST failed (${r.status}): ${JSON.stringify(body)}`);
  }
}

export async function findRenderPreviewUrl(params: {
  owner: string;
  repo: string;
  prNumber: number;
}): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) return null;

  const url = `https://api.github.com/repos/${params.owner}/${params.repo}/issues/${params.prNumber}/comments?per_page=50`;
  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!r.ok) return null;

  const comments = (await r.json()) as Array<{ body: string | null }>;
  for (const c of comments) {
    const m = (c.body ?? "").match(/https?:\/\/[a-z0-9-]+\.onrender\.com[^\s)]*/i);
    if (m) return m[0];
  }
  return null;
}
