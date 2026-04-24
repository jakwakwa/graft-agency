const RENDER_API_BASE = "https://api.render.com/v1";

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
      plan: "free",
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
