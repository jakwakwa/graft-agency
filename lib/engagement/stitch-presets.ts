import type { BuildVariant, BusinessArchetype } from "@/lib/types/engagement";

/**
 * The three Stitch design-system presets (sourced from the operator's personal
 * Stitch account). The pipeline always applies exactly one. Resolution is by
 * `displayName` at runtime (see stitch-design-concepts) so it is account-agnostic
 * — no per-account IDs are hard-coded.
 *
 * Mapping:
 *   - landing  → GRAFT Kit (the only light system, brand default)
 *   - campaign → dark dashboard preset:
 *       traditional business → Obsidian Scholar (editorial)
 *       flexible / niche      → Coach Vici (default)
 */
export type StitchPresetKey = "graft-kit-clarity" | "obsidian-scholar" | "coach-vici";

export interface StitchPreset {
  key: StitchPresetKey;
  /** Must match the design system's displayName in Stitch exactly. */
  displayName: string;
  theme: "light" | "dark";
}

export const GRAFT_KIT: StitchPreset = { key: "graft-kit-clarity", displayName: "Graft-kit Clarity", theme: "light" };
export const OBSIDIAN_SCHOLAR: StitchPreset = {
  key: "obsidian-scholar",
  displayName: "Obsidian Scholar",
  theme: "dark",
};
export const COACH_VICI: StitchPreset = {
  key: "coach-vici",
  displayName: "Coach Vici",
  theme: "dark",
};

export const STITCH_PRESETS: readonly StitchPreset[] = [GRAFT_KIT, OBSIDIAN_SCHOLAR, COACH_VICI];

/**
 * Pick the preset for a build. Landing pages use the light GRAFT Kit; campaign
 * dashboards use a dark system chosen by business archetype (traditional →
 * Obsidian Scholar, flexible/niche → Coach Vici, the default).
 */
export function selectStitchPreset(opts: {
  buildVariant: BuildVariant;
  businessArchetype?: BusinessArchetype;
}): StitchPreset {
  if (opts.buildVariant === "landing") return GRAFT_KIT;
  return opts.businessArchetype === "traditional" ? OBSIDIAN_SCHOLAR : COACH_VICI;
}
