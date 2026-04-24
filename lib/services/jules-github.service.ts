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

/** Parsed from ListActivities — https://jules.google/docs/api/reference/activities#progress-updated */
export interface JulesProgressUpdate {
  title: string;
  description: string;
}

/**
 * Pick the newest `progressUpdated` activity by `createTime` when present;
 * otherwise the last matching entry in API order.
 */
export function pickLatestJulesProgressFromActivities(
  activities: ReadonlyArray<Record<string, unknown>>,
): JulesProgressUpdate | null {
  let bestTime = -Infinity;
  let bestIdx = -1;
  let best: JulesProgressUpdate | null = null;

  for (let i = 0; i < activities.length; i++) {
    const a = activities[i];
    if (!a || typeof a !== "object") continue;
    const pu = a.progressUpdated as Record<string, unknown> | undefined;
    if (!pu || typeof pu.title !== "string") continue;
    const title = pu.title.trim();
    if (!title) continue;
    const description = typeof pu.description === "string" ? pu.description : "";
    const ct = a.createTime;
    const parsed = typeof ct === "string" ? Date.parse(ct) : Number.NaN;
    const timeKey = Number.isFinite(parsed) ? parsed : i;
    if (timeKey > bestTime || (timeKey === bestTime && i > bestIdx)) {
      bestTime = timeKey;
      bestIdx = i;
      best = { title, description };
    }
  }
  return best;
}

export function julesProgressToDbFields(progress: JulesProgressUpdate | null): {
  julesProgressTitle: string | null;
  julesProgressDescription: string | null;
} {
  if (!progress) {
    return { julesProgressTitle: null, julesProgressDescription: null };
  }
  const title = progress.title.trim();
  const desc = progress.description.trim();
  return {
    julesProgressTitle: title.length > 0 ? title : null,
    julesProgressDescription: desc.length > 0 ? desc : null,
  };
}

/** GET …/sessions/{id}/activities — best-effort; returns null on non-OK response. */
export async function fetchLatestJulesProgressUpdate(sessionId: string): Promise<JulesProgressUpdate | null> {
  const r = await fetch(`${JULES_API_BASE}/sessions/${sessionId}/activities?pageSize=50`, {
    headers: { "x-goog-api-key": getJulesKey() },
  });
  if (!r.ok) return null;
  const body = (await r.json()) as { activities?: Array<Record<string, unknown>> };
  const activities = body.activities ?? [];
  return pickLatestJulesProgressFromActivities(activities);
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

/** Jules REST uses a union on SessionOutput — often `output.pullRequest`, not only top-level `pullRequest`. */
function pullRequestUrlFromPrObject(pr: unknown): string | null {
  if (typeof pr !== "object" || pr === null) return null;
  const url = (pr as Record<string, unknown>).url;
  if (typeof url !== "string" || !url.includes("github.com") || !url.includes("/pull/")) return null;
  return url.split("?")[0] ?? null;
}

const GITHUB_PR_IN_JSON = /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/gi;

/** Last-resort: any GitHub PR URL embedded in JSON (handles proto/union shapes Jules may emit). */
export function extractFirstGithubPullUrlFromJson(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  try {
    const s = JSON.stringify(value);
    const matches = s.match(GITHUB_PR_IN_JSON);
    if (!matches?.length) return null;
    return matches[matches.length - 1]?.split("?")[0] ?? null;
  } catch {
    return null;
  }
}

export function extractPullRequestUrlFromSession(raw: Record<string, unknown>): string | null {
  const outputs = raw.outputs;
  if (Array.isArray(outputs)) {
    for (const output of outputs) {
      if (typeof output !== "object" || output === null) continue;
      const record = output as Record<string, unknown>;
      const direct = pullRequestUrlFromPrObject(record.pullRequest);
      if (direct) return direct;
      const wrapped = record.output;
      if (typeof wrapped === "object" && wrapped !== null) {
        const inner = pullRequestUrlFromPrObject((wrapped as Record<string, unknown>).pullRequest);
        if (inner) return inner;
      }
    }
    const fromOutputsBlob = extractFirstGithubPullUrlFromJson(outputs);
    if (fromOutputsBlob) return fromOutputsBlob;
  }

  const fromOutputsField = extractFirstGithubPullUrlFromJson(raw.outputs);
  if (fromOutputsField) return fromOutputsField;

  return extractFirstGithubPullUrlFromJson(raw);
}

/** Scan ListActivities for any embedded GitHub PR link (agent messages, artifacts, etc.). */
export async function extractPullRequestUrlFromActivities(sessionId: string): Promise<string | null> {
  const r = await fetch(`${JULES_API_BASE}/sessions/${sessionId}/activities?pageSize=100`, {
    headers: { "x-goog-api-key": getJulesKey() },
  });
  if (!r.ok) return null;
  const body = (await r.json()) as { activities?: unknown };
  return extractFirstGithubPullUrlFromJson(body.activities);
}

/** Default `sources/github/...` used when creating Jules sessions (must match poller + reconciler). */
export function defaultJulesGithubSource(): string {
  return process.env.JULES_SOURCE_REPO?.trim() ?? "sources/github/jakwakwa/graft-today-engagement-demo-builds";
}

/**
 * Resolve PR URL after Jules completes: session.outputs (all shapes), activities, then GitHub search.
 * @see https://developers.google.com/jules/api/reference/rest/v1alpha/sessions#SessionOutput
 * @see https://jules.google/docs/api/reference/activities
 */
export async function resolveJulesPullRequestUrl(params: {
  raw: Record<string, unknown>;
  sessionId: string;
  githubRepo: string;
}): Promise<string | null> {
  const fromRawField =
    typeof params.raw.pullRequestUrl === "string" && params.raw.pullRequestUrl.includes("github.com")
      ? params.raw.pullRequestUrl.split("?")[0]
      : null;
  if (fromRawField) return fromRawField;

  const fromOutputs = extractPullRequestUrlFromSession(params.raw);
  if (fromOutputs) return fromOutputs;

  const fromActivities = await extractPullRequestUrlFromActivities(params.sessionId);
  if (fromActivities) return fromActivities.split("?")[0] ?? null;

  const sourceFromSession =
    typeof params.raw.sourceContext === "object" &&
    params.raw.sourceContext !== null &&
    typeof (params.raw.sourceContext as Record<string, unknown>).source === "string"
      ? ((params.raw.sourceContext as Record<string, unknown>).source as string)
      : params.githubRepo;

  const repo = parseGithubRepoFromJulesSource(sourceFromSession) ?? parseGithubRepoFromJulesSource(params.githubRepo);
  if (!repo) return null;

  const pr = await findJulesPullRequest({ owner: repo.owner, repo: repo.repo, sessionId: params.sessionId });
  return pr?.htmlUrl ?? null;
}

export function parseGithubPullRequestFromUrl(url: string): { owner: string; repo: string; number: number } | null {
  const trimmed = url.split("?")[0];
  const m = trimmed.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i);
  if (!m) return null;
  const n = Number(m[3]);
  if (!Number.isFinite(n)) return null;
  return { owner: m[1], repo: m[2], number: n };
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
