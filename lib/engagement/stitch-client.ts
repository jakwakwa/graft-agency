import { Stitch, StitchToolClient } from "@google/stitch-sdk";
import { getGcpProjectId, getStitchAccessToken } from "@/lib/google/service-account";

/**
 * Build a Stitch client authenticated with the `gt-stitch-api` service account
 * (OAuth2 Bearer) — the professional replacement for the leaked `STITCH_API_KEY`.
 *
 * The SDK's auth helper prefers `apiKey` over `accessToken` and falls back to
 * `process.env.STITCH_API_KEY` via `||`, so we strip any stray value first to
 * guarantee the Bearer path even if a disabled key still lingers in the env.
 *
 * `projectId` (GCP project) becomes the `X-Goog-User-Project` quota/billing header
 * — distinct from `STITCH_PROJECT_ID`, which selects a Stitch *design* project.
 *
 * The caller owns the returned `client` and MUST `await client.close()` when done.
 */
export async function createStitchClient(): Promise<{ stitch: Stitch; client: StitchToolClient }> {
  if (process.env.STITCH_API_KEY) {
    delete process.env.STITCH_API_KEY;
  }
  const accessToken = await getStitchAccessToken();
  const client = new StitchToolClient({ accessToken, projectId: getGcpProjectId() });
  return { stitch: new Stitch(client), client };
}
