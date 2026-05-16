/**
 * Deterministic slug for `prospects/{slug}/` — must match Jules instructions and Render rootDir.
 */
export function slugFromCompanyName(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40)
    .replace(/^-|-$/g, "");
}
