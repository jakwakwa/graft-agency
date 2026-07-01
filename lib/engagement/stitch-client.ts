import { Stitch, StitchToolClient } from "@google/stitch-sdk";

/**
 * Build a Stitch client authenticated with the operator's PERSONAL Stitch
 * account via `STITCH_API_KEY`. We use the personal account (not the GCP
 * service account) so the operator retains Stitch Labs access to view and edit
 * the design systems + generated screens the pipeline produces, and so the
 * three personal-account presets resolve by name at runtime.
 *
 * `STITCH_PROJECT_ID` must point at the project in this account that holds the
 * three presets (GRAFT Kit / Obsidian Scholar / Obsidian Precision).
 *
 * The caller owns the returned `client` and MUST `await client.close()` when done.
 */
export async function createStitchClient(): Promise<{ stitch: Stitch; client: StitchToolClient }> {
  if (!process.env.STITCH_API_KEY?.trim()) {
    throw new Error("STITCH_API_KEY is required (personal Stitch account) — set it for the engagement pipeline.");
  }
  // StitchToolClient reads STITCH_API_KEY from the environment.
  const client = new StitchToolClient();
  return { stitch: new Stitch(client), client };
}
