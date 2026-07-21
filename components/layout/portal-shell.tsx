"use client";

import { UserButton } from "@clerk/nextjs";
import { CalendarDays, Code, CreditCard, LayoutDashboard, MessageSquare, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/shared/brand-logo";

interface PortalShellProps {
  children: ReactNode;
}

export function PortalShell({ children }: PortalShellProps) {
  const pathname = usePathname();

  const sidebarLinks = [
    { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
    { href: "/portal/conversations", label: "Conversations", icon: MessageSquare },
    { href: "/portal/bookings", label: "Bookings", icon: CalendarDays },
    { href: "/portal/settings", label: "Bot Settings", icon: Settings },
    { href: "/portal/embed", label: "Embed Code", icon: Code },
    { href: "/portal/billing", label: "Billing", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      {/* Top Header */}
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-ghost bg-card/85 px-6 shadow-ambient backdrop-blur-xl">
        <div className="flex items-center gap-8">
          <Link
            href="/portal"
            className="inline-flex items-center transition-opacity hover:opacity-90"
            aria-label="GRAFT.TODAY portal"
          >
            <BrandLogo height={28} />
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <UserButton />
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-16 z-40 hidden h-[calc(100vh-64px)] w-64 flex-col border-r border-outline-ghost bg-sidebar-accent pb-4 pt-8 md:flex">
        <div className="mb-8 px-6">
          <h2 className="mb-1 font-data text-xs font-bold uppercase tracking-widest text-secondary-foreground">
            Workspace
          </h2>
          <p className="text-[10px] text-muted-foreground">Portal Active</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <Link
                key={link.label}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 font-sans font-semibold transition-all group ${
                  isActive
                    ? "translate-x-1 border-l-2 border-primary bg-primary/10 text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive ? "text-primary" : "group-hover:text-primary transition-colors"}`}
                />
                <span className="flex-1">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="fixed overflow-y-scroll h-full w-full pt-16 md:pl-64 bg-background/50">{children}</main>
    </div>
  );
}
