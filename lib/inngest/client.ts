import { Inngest } from "inngest";

/**
 * Optional explicit Inngest **branch / environment** name for cloud event sends
 * (`Inngest-Env` header). Must match an environment that exists in your Inngest
 * project — do not guess (a wrong name yields `404 Branch environment does not exist`).
 *
 * If unset, we do not pass `env` on the client; the SDK still infers from
 * `INNGEST_ENV`, `VERCEL_GIT_COMMIT_REF`, etc. via its own `getEnvironmentName()`.
 *
 * For local `inngest dev`, set `INNGEST_DEV` to the dev server URL (e.g.
 * `http://127.0.0.1:8288`) so events are sent to the dev server instead of cloud
 * (no cloud branch name required).
 */
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
  const e = process.env;
  const n =
    e.KONA_INNGEST_ENV?.trim() ||
    e.INNGEST_ENV?.trim() ||
    e.BRANCH_NAME?.trim() ||
    e.VERCEL_GIT_COMMIT_REF?.trim() ||
    e.CF_PAGES_BRANCH?.trim() ||
    e.BRANCH?.trim() ||
    e.RENDER_GIT_BRANCH?.trim() ||
    e.RAILWAY_GIT_BRANCH?.trim() ||
    "";
  return n || undefined;
}

const inngestEnv = resolveInngestEnvironmentName();

export const inngest = new Inngest({
  id: "kona-agency",
  name: "GRAFT TODAY",
  eventKey: process.env.KONA_INNGEST_EVENT_KEY,
  signingKey: process.env.KONA_INNGEST_SIGNING_KEY,
  ...(inngestEnv ? { env: inngestEnv } : {}),
});
