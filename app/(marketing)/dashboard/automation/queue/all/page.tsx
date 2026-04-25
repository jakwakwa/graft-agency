import { DashboardWrapper } from "@/components/layout/dashboard-wrapper";
import { AutomationWrapper } from "@/components/layout/automation-wrapper";
import AllProspectsPageClient from "./page-client";

export default function AllProspectsPage() {
  return (
    <DashboardWrapper>
      <AutomationWrapper>
        <AllProspectsPageClient />
      </AutomationWrapper>
    </DashboardWrapper>
  );
}
