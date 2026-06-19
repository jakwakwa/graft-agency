import { GoogleAuth } from "google-auth-library";

/**
 * Service-account OAuth2 helper for Google Cloud APIs (Stitch, Jules, Vertex).
 *
 * Credentials are supplied as a **base64-encoded service-account JSON key** in an
 * env var (e.g. GCP_STITCH_SA_ACCOUNT_BASE64_KEY). We decode it, mint a short-lived
 * `cloud-platform` OAuth2 access token, and pass that as a Bearer token to the SDK.
 *
 * This replaces the leaked Labs-style API keys (STITCH_API_KEY / JULES_API_KEY).
 * The canonical copy of each key lives in GCP Secret Manager; the base64 env var is
 * the runtime-injected copy (Vercel env / local .env.local).
 */

/** Scope required to call Google Cloud APIs with a service account. */
const CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

function decodeServiceAccountKey(base64Key: string): Record<string, unknown> {
  let json: string;
  try {
    json = Buffer.from(base64Key, "base64").toString("utf8");
  } catch (cause) {
    throw new Error("Service-account key is not valid base64", { cause });
  }
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch (cause) {
    throw new Error("Decoded service-account key is not valid JSON", { cause });
  }
}

// One GoogleAuth per credential string. GoogleAuth caches and transparently
// refreshes the underlying access token, so reusing the instance avoids minting a
// fresh token on every call while still handling expiry inside long-lived processes.
const authCache = new Map<string, GoogleAuth>();

function getGoogleAuth(base64Key: string): GoogleAuth {
  let auth = authCache.get(base64Key);
  if (!auth) {
    auth = new GoogleAuth({
      credentials: decodeServiceAccountKey(base64Key),
      scopes: [CLOUD_PLATFORM_SCOPE],
    });
    authCache.set(base64Key, auth);
  }
  return auth;
}

/**
 * Mint a fresh OAuth2 access token from the base64 SA key stored in `envVar`.
 * @throws if the env var is missing or the key cannot produce a token.
 */
export async function getServiceAccountAccessToken(envVar: string): Promise<string> {
  const base64Key = process.env[envVar]?.trim();
  if (!base64Key) {
    throw new Error(`${envVar} is not set (base64-encoded service-account key required)`);
  }
  const token = await getGoogleAuth(base64Key).getAccessToken();
  if (!token) {
    throw new Error(`Failed to mint an access token from ${envVar}`);
  }
  return token;
}

/** GCP project id used for quota/billing (X-Goog-User-Project) with Bearer auth. */
export function getGcpProjectId(): string | undefined {
  return process.env.GCP_PROJECT_ID?.trim() || undefined;
}

/** OAuth2 access token for the Stitch service account. */
export function getStitchAccessToken(): Promise<string> {
  return getServiceAccountAccessToken("GCP_STITCH_SA_ACCOUNT_BASE64_KEY");
}
