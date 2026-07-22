"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/shared/brand-logo";

interface MarketingShellProps {
  children: ReactNode;
}

// Top Nav Configuration
const TOP_NAV_LINKS = [
  { href: "/dashboard/automation", label: "Dashboard" },
  { href: "/dashboard/automation/queue", label: "Prospect Queue" },
  { href: "/dashboard/automation/leads", label: "Leads" },
  { href: "/dashboard/automation/members", label: "Members" },
];

function DesktopNavLink({ link, pathname }: { link: { href: string; label: string }; pathname: string }) {
  const isActive = pathname === link.href || (link.href !== "/dashboard/automation" && pathname.startsWith(link.href));
  return (
    <Link
      href={link.href}
      className={`font-data text-xs uppercase tracking-[0.12em] transition-colors duration-150 font-bold ${
        isActive ? "text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {link.label}
    </Link>
  );
}

function MobileNavLink({ link, pathname }: { link: { href: string; label: string }; pathname: string }) {
  const isActive = pathname === link.href || pathname.startsWith(link.href);
  return (
    <Link
      href={link.href}
      className={`flex flex-col items-center gap-1 font-data ${isActive ? "text-secondary-foreground" : "text-muted-foreground"}`}
    >
      <span className="text-[10px] font-bold uppercase tracking-wide line-clamp-1 truncate max-w-[60px] text-center">
        {link.label}
      </span>
    </Link>
  );
}

export function MarketingShell({ children }: MarketingShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      {/* Top Header — Work Sans body; Lexend data chips (landing-v2 pattern) */}
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-ghost bg-card/85 px-6 shadow-ambient backdrop-blur-xl">
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard/automation"
            className="inline-flex items-center transition-opacity hover:opacity-90"
            aria-label="GRAFT.TODAY"
          >
            <BrandLogo height={28} />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {TOP_NAV_LINKS.map((link) => (
              <DesktopNavLink key={link.href} link={link} pathname={pathname} />
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 rounded-lg bg-muted/80 px-3 py-1 font-data lg:flex">
            <span className="text-xs text-secondary-foreground">AI Active</span>
            <div className="h-1 w-1 animate-pulse rounded-full bg-primary-kinetic" />
            <div className="h-4 w-px bg-outline-ghost" />
            <span className="text-xs text-muted-foreground">HTTPS/TLS</span>
          </div>
          <UserButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen w-full pt-16">{children}</main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t border-outline-ghost bg-card/90 px-6 backdrop-blur-md md:hidden">
        {TOP_NAV_LINKS.slice(0, 4).map((link) => (
          <MobileNavLink key={link.href} link={link} pathname={pathname} />
        ))}
      </nav>
    </div>
  );
}
