const RENDER_API_BASE = "https://api.render.com/v1";

/** Trim + strip one layer of surrounding quotes (common when pasting into host env UIs). */
function normalizeRenderEnvValue(raw: string): string {
  let s = raw.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (s.length >= 2) {
    const a = s[0];
    const b = s[s.length - 1];
    if ((a === '"' && b === '"') || (a === "'" && b === "'")) {
      s = s.slice(1, -1).trim();
    }
  }
  return s;
}

function getRenderApiKey(): string {
  const key = process.env.RENDER_API_KEY ? normalizeRenderEnvValue(process.env.RENDER_API_KEY) : "";
  if (!key) throw new Error("RENDER_API_KEY is not set");
  return key;
}

function getRenderOwnerId(): string {
  const ownerId = process.env.RENDER_OWNER_ID ? normalizeRenderEnvValue(process.env.RENDER_OWNER_ID) : "";
  if (!ownerId) throw new Error("RENDER_OWNER_ID is not set");
  return ownerId;
}

function renderHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getRenderApiKey()}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

/** Workspace (user or team) where Render resources are created — from GET /v1/owners, not arbitrary dashboard IDs. */
export interface RenderOwner {
  id: string;
  name: string;
  email?: string;
  type?: string;
}

function normalizeOwnerEntry(item: unknown): RenderOwner[] {
  if (!item || typeof item !== "object") return [];
  const rec = item as Record<string, unknown>;
  const wrapped = rec.owner;
  const payload = typeof wrapped === "object" && wrapped !== null ? (wrapped as Record<string, unknown>) : rec;
  const id = payload.id;
  const name = payload.name;
  if (typeof id !== "string" || typeof name !== "string") return [];
  return [
    {
      id,
      name,
      email: typeof payload.email === "string" ? payload.email : undefined,
      type: typeof payload.type === "string" ? payload.type : undefined,
    },
  ];
}

function parseOwnersResponse(json: unknown): RenderOwner[] {
  if (Array.isArray(json)) {
    return json.flatMap(normalizeOwnerEntry);
  }
  if (json && typeof json === "object") {
    const owners = (json as Record<string, unknown>).owners;
    if (Array.isArray(owners)) return owners.flatMap(normalizeOwnerEntry);
  }
  return [];
}

/** Lists workspaces your API key may manage. Use one of these `id` values for `RENDER_OWNER_ID` (see https://api-docs.render.com/reference/list-owners). */
export async function listRenderOwners(): Promise<RenderOwner[]> {
  const r = await fetch(`${RENDER_API_BASE}/owners?limit=100`, {
    headers: renderHeaders(),
  });
  if (!r.ok) {
    const err = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error(`Render list owners failed (${r.status}): ${JSON.stringify(err)}`);
  }
  const json: unknown = await r.json();
  return parseOwnersResponse(json);
}

function parseGithubRepoUrlFromJulesSource(source: string): string | null {
  const m = source.match(/^sources\/github\/([^/]+)\/([^/]+)$/);
  if (!m?.[1] || !m[2]) return null;
  return `https://github.com/${m[1]}/${m[2]}`;
}

function extractRenderServiceUrl(raw: Record<string, unknown>): string | null {
  const directUrl = raw.serviceUrl ?? raw.url;
  if (typeof directUrl === "string" && directUrl.startsWith("http")) return directUrl;

  const details = raw.serviceDetails;
  if (typeof details === "object" && details !== null) {
    const detailsUrl = (details as Record<string, unknown>).url;
    if (typeof detailsUrl === "string" && detailsUrl.startsWith("http")) return detailsUrl;
  }

  return null;
}

export interface RenderProvisionedService {
  serviceId: string;
  serviceName: string;
  serviceUrl: string | null;
  raw: Record<string, unknown>;
}

export function canProvisionRenderService(): boolean {
  const key = process.env.RENDER_API_KEY ? normalizeRenderEnvValue(process.env.RENDER_API_KEY) : "";
  const owner = process.env.RENDER_OWNER_ID ? normalizeRenderEnvValue(process.env.RENDER_OWNER_ID) : "";
  return Boolean(key && owner);
}

export async function provisionRenderService(params: {
  companySlug: string;
  julesRepoSource: string;
  rootDir: string;
  branch?: string;
}): Promise<RenderProvisionedService> {
  const repoUrl = parseGithubRepoUrlFromJulesSource(params.julesRepoSource);
  if (!repoUrl) {
    throw new Error(`Cannot derive GitHub repo URL from Jules source: ${params.julesRepoSource}`);
  }

  const serviceName = `prospect-${params.companySlug}`.slice(0, 63);
  // Render OpenAPI: servicePOST uses `serviceDetails` (oneOf by type), not `webServiceDetails`.
  // Native Node build/start commands live under serviceDetails.envSpecificDetails.
  const body: Record<string, unknown> = {
    type: "web_service",
    name: serviceName,
    ownerId: getRenderOwnerId(),
    repo: repoUrl,
    branch: params.branch ?? "main",
    rootDir: params.rootDir,
    autoDeploy: "yes",
    serviceDetails: {
      runtime: "node",
      envSpecificDetails: {
        buildCommand: "npm install && npm run build",
        startCommand: "npm start",
      },
    },
  };

  const environmentIdRaw = process.env.RENDER_ENVIRONMENT_ID?.trim();
  const environmentId = environmentIdRaw ? normalizeRenderEnvValue(environmentIdRaw) : "";
  if (environmentId) body.environmentId = environmentId;

  const r = await fetch(`${RENDER_API_BASE}/services`, {
    method: "POST",
    headers: renderHeaders(),
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const err = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    const msg = typeof err.message === "string" ? err.message : "";
    const isInvalidOwner = r.status === 400 && msg.toLowerCase().includes("invalid ownerid");
    if (isInvalidOwner) {
      let hint = "";
      try {
        const owners = await listRenderOwners();
        const ids = owners.map((o) => o.id).join(", ");
        hint = ` Owners visible to this RENDER_API_KEY: ${ids || "(none)"}. If your id appears here but creation still fails, check RENDER_ENVIRONMENT_ID belongs to that workspace, or compare env with where you ran \`bun run scripts/list-render-owners.ts\`.`;
      } catch {
        hint = " Could not call GET /v1/owners again for diagnostics.";
      }
      throw new Error(`Render service creation failed (${r.status}): ${JSON.stringify(err)}.${hint}`);
    }
    throw new Error(`Render service creation failed (${r.status}): ${JSON.stringify(err)}`);
  }

  const raw = (await r.json()) as Record<string, unknown>;
  const serviceId = raw.id;
  if (typeof serviceId !== "string" || serviceId.length === 0) {
    throw new Error("Render service creation response missing service id");
  }

  return {
    serviceId,
    serviceName,
    serviceUrl: extractRenderServiceUrl(raw),
    raw,
  };
}

export async function findRenderServiceByName(name: string): Promise<RenderProvisionedService | null> {
  const r = await fetch(`${RENDER_API_BASE}/services?name=${encodeURIComponent(name)}&limit=1`, {
    headers: renderHeaders(),
  });
  if (!r.ok) return null;
  const list = (await r.json()) as Array<{ service?: Record<string, unknown> }>;
  const first = list[0]?.service ?? list[0];
  if (!first || typeof (first as Record<string, unknown>).id !== "string") return null;
  const raw = first as Record<string, unknown>;
  return {
    serviceId: raw.id as string,
    serviceName: typeof raw.name === "string" ? raw.name : name,
    serviceUrl: extractRenderServiceUrl(raw),
    raw,
  };
}

export async function getRenderService(serviceId: string): Promise<RenderProvisionedService> {
  const r = await fetch(`${RENDER_API_BASE}/services/${serviceId}`, {
    headers: renderHeaders(),
  });

  if (!r.ok) {
    const err = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error(`Render service fetch failed (${r.status}): ${JSON.stringify(err)}`);
  }

  const raw = (await r.json()) as Record<string, unknown>;
  const name = raw.name;

  return {
    serviceId,
    serviceName: typeof name === "string" ? name : serviceId,
    serviceUrl: extractRenderServiceUrl(raw),
    raw,
  };
}

/** Point an existing web service at a Git branch (e.g. Jules PR head after code lands off `main`). */
export async function updateRenderServiceBranch(serviceId: string, branch: string): Promise<void> {
  const r = await fetch(`${RENDER_API_BASE}/services/${serviceId}`, {
    method: "PATCH",
    headers: renderHeaders(),
    body: JSON.stringify({ branch }),
  });
  if (!r.ok) {
    const err = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error(`Render branch update failed (${r.status}): ${JSON.stringify(err)}`);
  }
}
