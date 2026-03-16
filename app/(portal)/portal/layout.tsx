import Link from "next/link";
import type { ReactNode } from "react";

interface PortalLayoutProps {
  children: ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <>
      <PortalNavHeader />
      {children}
    </>
  );
}

function PortalNavHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <nav className="flex items-center gap-6">
        <Link href="/portal">Dashboard</Link>
        <Link href="/portal/embed">Embed</Link>
        <Link href="/portal/billing">Billing</Link>
        <Link href="/portal/settings">Settings</Link>
      </nav>
    </header>
  );
}
