import type { BuildVariant } from "@/lib/types/engagement";

/**
 * Resolve the build flavour for a lead: the per-lead choice persisted on the
 * ProductSpec at approval, else the env default (`DEFAULT_BUILD_VARIANT`), else
 * `campaign`. Shared by prd-writer and jules-builder so the PRD, the build
 * prompt, and the artifact all describe the same thing.
 */
export function resolveBuildVariant(specValue: string | null | undefined): BuildVariant {
  if (specValue === "landing" || specValue === "campaign") return specValue;
  return process.env.DEFAULT_BUILD_VARIANT === "landing" ? "landing" : "campaign";
}
