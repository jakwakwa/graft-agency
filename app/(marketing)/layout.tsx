import type { ReactNode } from "react";
import { NavHeader } from "@/components/shared/nav-header";

interface MarketingLayoutProps {
  children: ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <>
      <NavHeader />
      {children}
    </>
  );
}
