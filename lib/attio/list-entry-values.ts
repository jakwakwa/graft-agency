import type { LeadSource } from "@prisma/client";

/** Default Attio list attribute slugs — override via env in the API route if your workspace differs. */
export const ATTIO_LIST_ENTRY_SLUGS = {
  prospectSource: "prospect_source",
  url: "url",
  type: "type",
  createdBy: "created_by",
} as const;

/**
 * Maps our lead source to Attio "Prospect source" option values (lowercase, aligned with typical list views).
 */
export function mapLeadSourceToProspectSource(source: LeadSource): string {
  switch (source) {
    case "INBOUND":
      return "inbound";
    case "OUTBOUND_PROSPECT":
      return "outbound";
    default: {
      const _exhaustive: never = source;
      return _exhaustive;
    }
  }
}

/**
 * Best-effort label for industry / type: prefers explicit industry, then first core service, then a short business description.
 */
export function deriveLeadTypeLabel(scraped: Record<string, unknown>): string | undefined {
  const industry = scraped.industry;
  if (typeof industry === "string" && industry.trim().length > 0) {
    return industry.trim();
  }

  const core = scraped.coreServices;
  if (Array.isArray(core) && core.length > 0) {
    const first = core[0];
    if (first && typeof first === "object") {
      const row = first as Record<string, unknown>;
      const fromServiceName = row.service_name;
      if (typeof fromServiceName === "string" && fromServiceName.trim().length > 0) {
        return fromServiceName.trim();
      }
      const fromName = row.name;
      if (typeof fromName === "string" && fromName.trim().length > 0) {
        return fromName.trim();
      }
    }
  }

  const desc = scraped.businessDescription;
  if (typeof desc === "string" && desc.trim().length > 0) {
    const trimmed = desc.trim();
    return trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed;
  }

  return undefined;
}

export function formatCreatedByLabel(input: {
  fullName: string | null | undefined;
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  username: string | null | undefined;
  primaryEmail: string | null | undefined;
}): string {
  if (input.fullName?.trim()) return input.fullName.trim();
  const first = input.firstName?.trim() ?? "";
  const last = input.lastName?.trim() ?? "";
  const combined = [first, last].filter(Boolean).join(" ").trim();
  if (combined) return combined;
  if (input.username?.trim()) return input.username.trim();
  if (input.primaryEmail?.trim()) return input.primaryEmail.trim();
  return "Unknown user";
}
