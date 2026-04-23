const JULES_API_BASE = "https://jules.googleapis.com/v1alpha";

function getJulesKey(): string {
  const key = process.env.JULES_API_KEY?.trim();
  if (!key) throw new Error("JULES_API_KEY is not set");
  return key;
}

function julesHeaders() {
  return { "x-goog-api-key": getJulesKey(), "Content-Type": "application/json" };
}

export interface JulesSession {
  sessionId: string;
  sessionUrl: string;
  state: string;
}

export async function createJulesSession(params: {
  repoSource: string;
  startingBranch: string;
  title: string;
  prompt: string;
  requirePlanApproval?: boolean;
}): Promise<JulesSession> {
  const body = {
    title: params.title,
    prompt: params.prompt,
    automationMode: "AUTO_CREATE_PR",
    sourceContext: {
      source: params.repoSource,
      githubRepoContext: { startingBranch: params.startingBranch },
      environmentVariablesEnabled: true,
    },
    requirePlanApproval: params.requirePlanApproval ?? false,
  };

  const r = await fetch(`${JULES_API_BASE}/sessions`, {
    method: "POST",
    headers: julesHeaders(),
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const err = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error(`Jules session creation failed (${r.status}): ${JSON.stringify(err)}`);
  }

  const sess = (await r.json()) as { id: string; url: string; state?: string; name: string };
  return {
    sessionId: sess.id,
    sessionUrl: sess.url,
    state: sess.state ?? "QUEUED",
  };
}

// Find an existing Jules session whose title contains `[leadId]` sentinel.
// Used by the idempotency layer to recover a session created in a prior attempt.
export async function findJulesSessionByLeadTag(leadId: string): Promise<JulesSession | null> {
  const r = await fetch(`${JULES_API_BASE}/sessions?pageSize=20`, {
    headers: { "x-goog-api-key": getJulesKey() },
  });
  if (!r.ok) return null;
  const body = (await r.json()) as { sessions?: Array<Record<string, unknown>> };
  const sessions = body.sessions ?? [];
  const tag = `[${leadId}]`;
  const match = sessions.find((s) => typeof s.title === "string" && s.title.includes(tag));
  if (!match) return null;
  return {
    sessionId: match.id as string,
    sessionUrl: match.url as string,
    state: (match.state as string) ?? "QUEUED",
  };
}

export async function getJulesSession(sessionId: string): Promise<JulesSession & { raw: Record<string, unknown> }> {
  const r = await fetch(`${JULES_API_BASE}/sessions/${sessionId}`, {
    headers: { "x-goog-api-key": getJulesKey() },
  });

  if (!r.ok) {
    const err = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error(`Jules session fetch failed (${r.status}): ${JSON.stringify(err)}`);
  }

  const sess = (await r.json()) as Record<string, unknown> & { id: string; url: string; state: string };
  return { sessionId: sess.id, sessionUrl: sess.url, state: sess.state, raw: sess };
}

export async function approveJulesPlan(sessionId: string): Promise<void> {
  const r = await fetch(`${JULES_API_BASE}/sessions/${sessionId}:approvePlan`, {
    method: "POST",
    headers: julesHeaders(),
    body: JSON.stringify({}),
  });

  if (!r.ok) {
    const err = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error(`Jules plan approval failed (${r.status}): ${JSON.stringify(err)}`);
  }
}

export function extractPullRequestUrlFromSession(raw: Record<string, unknown>): string | null {
  const outputs = raw.outputs;
  if (!Array.isArray(outputs)) return null;

  for (const output of outputs) {
    if (typeof output !== "object" || output === null) continue;
    const record = output as Record<string, unknown>;
    const pullRequest = record.pullRequest;
    if (typeof pullRequest !== "object" || pullRequest === null) continue;
    const url = (pullRequest as Record<string, unknown>).url;
    if (typeof url === "string" && url.startsWith("http")) return url;
  }
  return null;
}

export const JULES_TERMINAL_STATES = new Set(["COMPLETED", "SUCCEEDED", "FAILED", "CANCELLED", "CANCELED", "ERROR"]);

export function isJulesTerminalState(state: string | null | undefined): boolean {
  if (!state) return false;
  return JULES_TERMINAL_STATES.has(state.toUpperCase());
}

export function isJulesFailedState(state: string | null | undefined): boolean {
  if (!state) return false;
  const s = state.toUpperCase();
  return s === "FAILED" || s === "ERROR" || s === "CANCELLED" || s === "CANCELED";
}

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

  const url = `https://api.github.com/repos/${params.owner}/${params.repo}/pulls?state=all&sort=created&direction=desc&per_page=30`;
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
    body: string | null;
    state: string;
    merged_at: string | null;
    head: { ref: string };
  }>;

  const match =
    prs.find((p) => (p.body ?? "").includes(params.sessionId) || p.head.ref.includes(params.sessionId)) ??
    prs.find((p) => p.head.ref.startsWith("jules") || p.head.ref.startsWith("feat/"));

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
