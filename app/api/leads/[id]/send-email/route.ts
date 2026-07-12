import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { requirePlatformAccess } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";
import { emailService } from "@/lib/services/email.service";
import { getStageCategory } from "@/lib/utils/engagement-stages";

const sendEmailSchema = z.object({
  subject: z.string().trim().min(1).max(300).optional(),
  body: z.string().trim().min(1).optional(),
});

/**
 * Dispatch the (edited) outreach draft to the lead. Only allowed once the
 * engagement pipeline has completed, so the email can carry a working
 * prototype link (build or design fallback).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requirePlatformAccess();
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  const { clientId } = result;

  const { id } = await params;
  const where: Prisma.LeadWhereInput = { id, clientId, source: "OUTBOUND_PROSPECT" };
  const lead = await prisma.lead.findFirst({
    where,
    include: { productSpec: { select: { stage: true } } },
  });

  if (!lead) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (getStageCategory(lead.productSpec?.stage ?? "NOT_STARTED") !== "complete") {
    return Response.json({ error: "Engagement pipeline has not completed for this lead" }, { status: 400 });
  }

  if (!lead.email) {
    return Response.json({ error: "Lead has no email address" }, { status: 400 });
  }

  let rawBody: unknown = {};
  try {
    rawBody = await req.json();
  } catch {
    // No JSON body — fall back to the saved draft.
  }
  const parsed = sendEmailSchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
  }

  const scrapedData = (lead.scrapedData ?? {}) as Record<string, unknown>;
  const subject = parsed.data.subject ?? (typeof scrapedData.draftSubject === "string" ? scrapedData.draftSubject : "");
  const body = parsed.data.body ?? (typeof scrapedData.draftBody === "string" ? scrapedData.draftBody : "");

  if (!subject || !body) {
    return Response.json({ error: "Draft subject and body are required" }, { status: 400 });
  }

  const { id: emailId } = await emailService.sendOutreach({ to: lead.email, subject, body });

  const updatedScrapedData = {
    ...scrapedData,
    draftSubject: subject,
    draftBody: body,
    outreachEmailSentAt: new Date().toISOString(),
  };
  await prisma.lead.update({
    where: { id },
    data: {
      scrapedData: JSON.parse(JSON.stringify(updatedScrapedData)) as Prisma.InputJsonValue,
    },
  });

  return Response.json({ success: true, leadId: id, emailId: emailId ?? null });
}
