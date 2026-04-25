/** Normalized company name for duplicate matching (trim, lowercase, collapse spaces). */
export function normalizeProspectCompanyName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Normalized website identity: lowercase host without `www.`, optional path (no trailing slash).
 * Used consistently for CRM exclusions and Gemini output comparison.
 */
export function normalizeProspectWebsiteUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  try {
    const withProto = t.includes("://") ? t : `https://${t}`;
    const u = new URL(withProto);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    const path = u.pathname.replace(/\/$/, "") || "";
    return path ? `${host}${path}` : host;
  } catch {
    return t
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "");
  }
}

export function scrapedDataWebsiteUrl(scrapedData: unknown): string | null {
  if (scrapedData && typeof scrapedData === "object" && "websiteUrl" in scrapedData) {
    const w = (scrapedData as { websiteUrl?: unknown }).websiteUrl;
    return typeof w === "string" && w.trim() ? w : null;
  }
  return null;
}

export function prospectIdentityKeys(companyName: string, websiteUrl: string): { nameKey: string; urlKey: string } {
  return {
    nameKey: normalizeProspectCompanyName(companyName),
    urlKey: normalizeProspectWebsiteUrl(websiteUrl),
  };
}
