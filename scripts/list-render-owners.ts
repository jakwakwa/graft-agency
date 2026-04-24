/**
 * Prints workspace owner IDs your RENDER_API_KEY can use for `RENDER_OWNER_ID`.
 *
 *   bun run scripts/list-render-owners.ts
 *
 * Service creation rejects some ids (e.g. wrong workspace); the ids listed here
 * match GET https://api.render.com/v1/owners — see Render API docs.
 */
import "dotenv/config";

import { listRenderOwners } from "@/lib/services/render.service";

async function main(): Promise<void> {
  const owners = await listRenderOwners();
  if (owners.length === 0) {
    console.log("No owners returned. Check RENDER_API_KEY and that the key has workspace access.");
    return;
  }
  console.log("Use one of these ids as RENDER_OWNER_ID:\n");
  for (const o of owners) {
    const extra = [o.type, o.email].filter(Boolean).join(" · ");
    console.log(`${o.id}\t${o.name}${extra ? `\t(${extra})` : ""}`);
  }
  console.log(
    "\nOwner ids are scoped to the API key used above (and must match POST /v1/services payload — see lib/services/render.service.ts).",
  );
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
