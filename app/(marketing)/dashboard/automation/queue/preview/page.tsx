import { DashboardWrapper } from "@/components/layout/dashboard-wrapper";
import { AutomationWrapper } from "@/components/layout/automation-wrapper";
import PreviewPageClient from "./page-client";

export default function PreviewPage() {
  return (
    <DashboardWrapper>
      <AutomationWrapper>
        <PreviewPageClient />
      </AutomationWrapper>
    </DashboardWrapper>
  );
}
