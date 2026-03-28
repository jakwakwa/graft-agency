import { requirePlatformAccess } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";
import { geminiProspectingService } from "@/lib/services/gemini-prospecting.service";

export async function POST() {
  const result = await requirePlatformAccess();
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  const { clientId } = result;

  const config = await prisma.prospectingConfig.findUnique({
    where: { clientId },
  });

  if (!config?.searchCriteria) {
    return Response.json(
      { error: "No search criteria configured. Set up your prospecting config first." },
      { status: 400 },
    );
  }

  const criteria = config.searchCriteria as {
    industries?: string[];
    locations?: string[];
    keywords?: string[];
  };
  const parts = [
    ...(criteria.industries ?? []),
    ...(criteria.locations ?? []),
    ...(criteria.keywords ?? []),
  ];

  if (parts.length === 0) {
    return Response.json(
      { error: "Search criteria is empty. Add industries, locations, or keywords." },
      { status: 400 },
    );
  }

  try {
    const { created, errors } = await geminiProspectingService.findAndAuditProspects({
      clientId,
      searchCriteria: criteria,
      valueProposition: config.valueProposition,
    });

    return Response.json({ created, errors });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Prospecting failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
