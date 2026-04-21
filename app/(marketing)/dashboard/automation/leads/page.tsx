import { AutomationWrapper } from "@/components/layout/automation-wrapper";
import { DashboardWrapper } from "@/components/layout/dashboard-wrapper";
import LeadsPageClient from "./page-client";

export default function LeadsPage() {
  return (
    <DashboardWrapper>
      <AutomationWrapper>
        <LeadsPageClient />
      </AutomationWrapper>
    </DashboardWrapper>
  );
}
