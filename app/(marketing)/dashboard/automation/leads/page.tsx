import { redirect } from "next/navigation";
import { AutomationWrapper } from "@/components/layout/automation-wrapper";
import { DashboardWrapper } from "@/components/layout/dashboard-wrapper";
import { requirePlatformAccess } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";
import LeadsPageClient from "./page-client";

export default async function LeadsPage() {
  const result = await requirePlatformAccess();
  if ("error" in result) {
    redirect("/dashboard");
  }

  const leads = await prisma.lead.findMany({
    where: {
      clientId: result.clientId,
      source: "OUTBOUND_PROSPECT",
      status: "DRAFT_PENDING",
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize dynamic Json fields safely
  const serializedLeads = leads.map((lead) => ({
    id: lead.id,
    customerName: lead.customerName,
    status: lead.status,
    scrapedData: lead.scrapedData ? (lead.scrapedData as Record<string, unknown>) : null,
  }));

  return (
    <DashboardWrapper>
      <AutomationWrapper>
        <LeadsPageClient initialLeads={serializedLeads} />
      </AutomationWrapper>
    </DashboardWrapper>
  );
}
