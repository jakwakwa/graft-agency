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
  const e = process.env;
  const n = e.INNGEST_EVENT_KEY?.trim() || e.INNGEST_ENV?.trim() || e.BRANCH_NAME?.trim() || "";
  return n || undefined;
}

const inngestEnv = resolveInngestEnvironmentName();

export const inngest = new Inngest({
  id: "graft-agency",
  name: "GRAFT_EVENT_PROD",
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
  ...(inngestEnv ? { env: inngestEnv } : {}),
});
