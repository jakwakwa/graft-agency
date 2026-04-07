"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

export function NavHeader() {
  const pathname = usePathname();
  if (pathname?.startsWith("/widget/")) return null;

  return (
    <header className="flex h-16 items-center justify-between bg-muted/50 px-4 shadow-ambient backdrop-blur-sm md:px-6">
      <nav className="flex items-center gap-6">
        <Link href="/" className="text-foreground transition-colors hover:text-secondary">
          <Typography.Large>GRAFT TODAY</Typography.Large>
        </Link>
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
        <Link href="/portal" className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80">
          Portal
        </Link>
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
