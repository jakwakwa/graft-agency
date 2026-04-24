import { AutomationWrapper } from "@/components/layout/automation-wrapper";
import { DashboardWrapper } from "@/components/layout/dashboard-wrapper";
import ProspectPageClient from "./page-client";

export default function ProspectPage() {
  return (
    <DashboardWrapper>
      <AutomationWrapper>
        <ProspectPageClient />
      </AutomationWrapper>
    </DashboardWrapper>
  );
}
