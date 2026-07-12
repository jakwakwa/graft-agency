/**
 * Pure helpers for reading Stitch design concepts persisted on
 * `ProductSpec.designConcepts` (untyped Json column).
 *
 * Shared by the engagement panel and the leads approval queue.
 */

export function asRecord(v: unknown): Record<string, unknown> | null {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

export function parseDesignConcepts(raw: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => asRecord(c) ?? {})
    .filter((c) => Object.keys(c).length > 0 && typeof c.projectId === "string" && c.projectId.length > 0);
}

export function conceptLink(c: Record<string, unknown>): string | undefined {
  for (const k of ["htmlUrl"]) {
    const v = c[k];
    if (typeof v === "string" && (v.startsWith("http://") || v.startsWith("https://"))) {
      return v;
    }
  }
  return undefined;
}

export function conceptScreenId(c: Record<string, unknown>): string | undefined {
  const v = c.screenId;
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export function conceptProjectId(c: Record<string, unknown>): string | undefined {
  const v = c.projectId;
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/**
 * Same-origin proxy URL that re-serves a Stitch screen as fresh `text/html`
 * (the stored `htmlUrl` is a short-lived signed GCS URL — see
 * `app/api/engagement/stitch-html/route.ts`). Falls back to the raw link
 * when screen identifiers are missing.
 */
export function conceptHtmlHref(pId?: string, sId?: string, link?: string): string | undefined {
  if (sId && pId) {
    return `/api/engagement/stitch-html?projectId=${encodeURIComponent(pId)}&screenId=${encodeURIComponent(sId)}`;
  }
  return link;
}
