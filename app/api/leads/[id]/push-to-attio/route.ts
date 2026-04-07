import { z } from "zod";
import { requirePlatformAccess } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";
import { attioService } from "@/lib/services/attio.service";

const scrapedDataSchema = z.object({
  websiteUrl: z.string().url(),
});

interface PushWarning {
  step: string;
  severity: "critical" | "minor";
  error: string;
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requirePlatformAccess();
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  const { clientId } = result;

  const { id } = await params;

  const lead = await prisma.lead.findFirst({
    where: { id, clientId, source: "OUTBOUND_PROSPECT" },
  });

  if (!lead) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Validate websiteUrl from scrapedData
  const parsed = scrapedDataSchema.safeParse(
    lead.scrapedData && typeof lead.scrapedData === "object" ? lead.scrapedData : {},
  );
  if (!parsed.success) {
    return Response.json(
      { error: "Lead has no valid website URL — required for Attio domain matching" },
      { status: 422 },
    );
  }

  const { websiteUrl } = parsed.data;
  const wasAlreadySynced = !!lead.attioRecordId;

  const scrapedData = lead.scrapedData as Record<string, unknown>;

  // [PREREQ] Upsert company in Attio (required before list entry)
  const companyResult = await attioService.upsertCompany({
    customerName: lead.customerName ?? "Unknown Company",
    websiteUrl,
  });

  if ("error" in companyResult) {
    return Response.json({ error: `Attio company upsert failed: ${companyResult.error}` }, { status: 502 });
  }

  const { recordId } = companyResult;

  // Persist attioRecordId immediately — before list/note calls
  await prisma.lead.update({
    where: { id },
    data: { attioRecordId: recordId },
  });

  const warnings: PushWarning[] = [];

  // [PRIMARY] Add to Attio list
  const listResult = await attioService.addToList({ recordId });
  if ("error" in listResult) {
    warnings.push({
      step: "addToList",
      severity: "critical",
      error: `Could not add to Attio list — check ATTIO_LIST_ID. ${listResult.error}`,
    });
  }

  // [SECONDARY] Add note with prospect details
  const noteResult = await attioService.addNote({
    recordId,
    leadId: id,
    customerName: lead.customerName ?? "Unknown Company",
    painPoints: Array.isArray(scrapedData.painPoints) ? (scrapedData.painPoints as string[]) : [],
    targetOutreachAngle:
      typeof scrapedData.targetOutreachAngle === "string" ? scrapedData.targetOutreachAngle : undefined,
    draftSubject: typeof scrapedData.draftSubject === "string" ? scrapedData.draftSubject : undefined,
  });
  if ("error" in noteResult) {
    warnings.push({
      step: "addNote",
      severity: "minor",
      error: noteResult.error,
    });
  }

  return Response.json({
    success: true,
    attioRecordId: recordId,
    wasAlreadySynced,
    warnings,
  });
}
