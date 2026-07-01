/**
 * One-time: upload the three DESIGN.md presets in `guidelines/` to Stitch as
 * design systems, verbatim (the whole file goes into `theme.designMd`).
 *
 * Uses the SAME auth + project as the engagement pipeline (gt-stitch-api service
 * account via createStitchClient + STITCH_PROJECT_ID) so the presets are visible
 * to stitch-design-concepts at runtime.
 *
 * Run (with the pipeline's Stitch env available):
 *   bun run scripts/upload-stitch-presets.ts
 *
 * Idempotent: skips a preset if a design system with the same displayName exists.
 * Prints each design system's id — capture these for the pipeline wiring.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { createStitchClient } from "@/lib/engagement/stitch-client";

const PRESET_FILES = [
  "guidelines/Guidelines DESIGN-preset-01.md",
  "guidelines/Guidelines DESIGN-preset-02.md",
  "guidelines/Guidelines DESIGN-preset-03.md",
];

/** Pull the `name:` from the YAML frontmatter for the Stitch displayName. */
function parseDisplayName(markdown: string, fallback: string): string {
  for (const line of markdown.split("\n").slice(0, 8)) {
    const m = line.match(/^\**\s*name:\s*(.+?)\s*$/i);
    if (m?.[1]) return m[1].replace(/^["']|["']$/g, "").trim();
  }
  return fallback;
}

const PRESET_PROJECT_TITLE = "GRAFT Engagement Presets";

async function main() {
  const { stitch, client } = await createStitchClient();
  try {
    // Presets are project-scoped, so they must live in ONE stable project the
    // pipeline always reuses. Honour STITCH_PROJECT_ID if set; otherwise reuse a
    // named project (or create it) and report the id to pin via STITCH_PROJECT_ID.
    const pinnedId = process.env.STITCH_PROJECT_ID?.trim();
    let project = pinnedId ? stitch.project(pinnedId) : undefined;
    if (!project) {
      const all = await stitch.projects().catch(() => []);
      project = all.find((p) => {
        const d = p.data as { title?: string; displayName?: string } | undefined;
        return d?.title === PRESET_PROJECT_TITLE || d?.displayName === PRESET_PROJECT_TITLE;
      });
      if (!project) project = await stitch.createProject(PRESET_PROJECT_TITLE);
      console.log(`\n>>> STITCH_PROJECT_ID is not set. Using project "${PRESET_PROJECT_TITLE}" → ${project.projectId}`);
      console.log(`>>> Pin it: set STITCH_PROJECT_ID=${project.projectId} in your env so the pipeline reuses it.\n`);
    }

    const existing = await project.listDesignSystems();
    const existingNames = new Set(existing.map((d) => d.data?.displayName).filter(Boolean));

    for (const rel of PRESET_FILES) {
      const abs = path.resolve(process.cwd(), rel);
      const markdown = readFileSync(abs, "utf-8");
      const displayName = parseDisplayName(markdown, path.parse(rel).name);

      if (existingNames.has(displayName)) {
        const found = existing.find((d) => d.data?.displayName === displayName);
        console.log(`SKIP  "${displayName}" already exists → ${found?.id}`);
        continue;
      }

      const ds = await project.createDesignSystem({
        displayName,
        theme: { designMd: markdown },
      });
      console.log(`OK    "${displayName}" → ${ds.id}`);
    }

    console.log("\nAll presets present. Wire these IDs into the pipeline (see STITCH_PRESET_* env).");
  } finally {
    await client.close().catch(() => {});
  }
}

main().catch((err) => {
  console.error("upload-stitch-presets failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
