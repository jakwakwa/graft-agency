import { redirect } from "next/navigation";
import { AutomationWrapper } from "@/components/layout/automation-wrapper";
import { DashboardWrapper } from "@/components/layout/dashboard-wrapper";
import type { LeadStatus, Prisma } from "@/generated/prisma/client";
import { requirePlatformAccess } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";
import LeadsPageClient from "./page-client";

const APPROVAL_FLOW_STATUSES: LeadStatus[] = ["DRAFT_PENDING", "CONTACTED", "REPLIED", "BOOKED", "CLOSED"];

export default async function LeadsPage() {
  const result = await requirePlatformAccess();
  if ("error" in result) {
    redirect("/dashboard");
  }

  // All outbound prospects that entered the approval flow — the client filters
  // by derived pipeline status (draft / approved / denied / failed).
  const where: Prisma.LeadWhereInput = {
    clientId: result.clientId,
    source: "OUTBOUND_PROSPECT",
    status: { in: APPROVAL_FLOW_STATUSES },
  };
  // Typed like app/api/leads/route.ts — an inline orderBy literal next to
  // `include` collapses the payload type under TS 6 and drops `productSpec`.
  const orderBy: Prisma.LeadOrderByWithRelationInput = { createdAt: "desc" };
  const leads = await prisma.lead.findMany({
    where,
    orderBy,
    include: {
      productSpec: {
        select: {
          stage: true,
          failedStage: true,
          deploymentUrl: true,
          designConcepts: true,
          chosenDesign: true,
          offerSentAt: true,
        },
      },
    },
  });

  // Serialize dynamic Json fields safely
  const serializedLeads = leads.map((lead) => ({
    id: lead.id,
    customerName: lead.customerName,
    email: lead.email,
    status: lead.status,
    scrapedData: lead.scrapedData ? (lead.scrapedData as Record<string, unknown>) : null,
    engagement: lead.productSpec
      ? {
          stage: lead.productSpec.stage as string,
          failedStage: (lead.productSpec.failedStage as string | null) ?? null,
          deploymentUrl: lead.productSpec.deploymentUrl,
          designConcepts: lead.productSpec.designConcepts as unknown,
          chosenDesign: lead.productSpec.chosenDesign,
          offerSentAt: lead.productSpec.offerSentAt?.toISOString() ?? null,
        }
      : null,
  }));

  return (
    <DashboardWrapper>
      <AutomationWrapper>
        <LeadsPageClient initialLeads={serializedLeads} />
      </AutomationWrapper>
    </DashboardWrapper>
  );
}
