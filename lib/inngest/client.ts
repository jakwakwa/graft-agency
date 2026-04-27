import { Inngest } from "inngest";

function isInngestDevMode(): boolean {
  const d = process.env.INNGEST_DEV?.trim();
  if (!d) return false;
  if (d === "1" || d === "true") return true;
  return /^https?:\/\//i.test(d);
}

function resolveInngestEnvironmentName(): string | undefined {
  if (isInngestDevMode()) {
    return undefined;
  }
  // Inngest `env` is the branch/environment slug in Cloud (e.g. production), not the event key.
  const n = process.env.INNGEST_ENV?.trim() || process.env.BRANCH_NAME?.trim() || "";
  return n || undefined;
}

const inngestEnv = resolveInngestEnvironmentName();

/** On Vercel, never target the local dev server (localhost:8288); `INNGEST_DEV` may still be visible in some runtimes. */
const runningOnVercel = process.env.VERCEL === "1";

export const inngest = new Inngest({
  id: "graft-agency",
  name: "GRAFT_EVENT_PROD",
  ...(runningOnVercel ? { isDev: false } : {}),
  eventKey: process.env.GRAFT_INNGEST_EVENT_KEY,
  signingKey: process.env.GRAFT_INNGEST_SIGNING_KEY,
  ...(inngestEnv ? { env: inngestEnv } : {}),
});
