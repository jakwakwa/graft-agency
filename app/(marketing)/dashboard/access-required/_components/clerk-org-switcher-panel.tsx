"use client";

import { OrganizationSwitcher } from "@clerk/nextjs";

export function ClerkOrgSwitcherPanel() {
  return (
    <div className="mt-8 flex flex-col items-stretch gap-2 sm:items-start">
      <OrganizationSwitcher afterSelectOrganizationUrl="/dashboard" afterCreateOrganizationUrl="/dashboard" />
    </div>
  );
}
