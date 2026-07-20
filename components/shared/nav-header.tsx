"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";

type ClientFlags = { isPlatformOwner: boolean };

export function NavHeader() {
  const pathname = usePathname();
  const [flags, setFlags] = useState<ClientFlags>({ isPlatformOwner: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me/client-flags")
      .then((r) => r.json())
      .then((data: ClientFlags) => setFlags(data))
      .catch((err) => console.error("[NavHeader] failed to load client flags", err))
      .finally(() => setLoading(false));
  }, []);

  if (pathname?.startsWith("/widget/")) return null;

  const hasPlatformAccess = flags.isPlatformOwner;

  return (
    <header className="flex h-16 items-center justify-between bg-muted/50 px-4 shadow-ambient backdrop-blur-sm md:px-6">
      <nav className="flex items-center gap-6">
        <Link
          href="/"
          className="inline-flex items-center transition-opacity hover:opacity-90"
          aria-label="GRAFT.TODAY home"
        >
          <BrandLogo height={28} />
        </Link>

        {loading ? (
          <>
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </>
        ) : (
          <>
            {hasPlatformAccess && !pathname?.startsWith("/portal") && (
              <>
                <Link
                  href="/dashboard/automation"
                  className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/automation/queue"
                  className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
                >
                  Prospect Queue
                </Link>
                <Link
                  href="/dashboard/automation/leads"
                  className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
                >
                  Draft Leads
                </Link>
              </>
            )}

            {pathname?.startsWith("/portal") && (
              <>
                <Link
                  href="/portal"
                  className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
                >
                  Dashboard
                </Link>
                <Link
                  href="/portal/embed"
                  className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
                >
                  Embed
                </Link>
                <Link
                  href="/portal/billing"
                  className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
                >
                  Billing
                </Link>
                <Link
                  href="/portal/settings"
                  className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
                >
                  Settings
                </Link>
              </>
            )}

            {!pathname?.startsWith("/portal") && (
              <Link
                href="/portal"
                className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
              >
                My Portal
              </Link>
            )}
          </>
        )}
      </nav>
      <div className="flex items-center gap-4">
        <ModeToggle />
        <Show when="signed-out">
          <SignInButton>
            <Button size="default" variant="ghost">
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton>
            <Button size="default" variant="default">
              Sign Up
            </Button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
