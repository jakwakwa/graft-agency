"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Typography } from "@/components/ui/typography";

export function NavHeader() {
  const pathname = usePathname();
  if (pathname?.startsWith("/widget/")) return null;

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <nav className="flex items-center gap-6">
        <Link href="/" className="text-foreground hover:text-foreground/80 transition-colors">
          <Typography.Large>Kona Agency</Typography.Large>
        </Link>
        <Link
          href="/dashboard/automation"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/dashboard/automation/queue"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Prospect Queue
        </Link>
        <Link
          href="/dashboard/automation/leads"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Draft Leads
        </Link>
        <Link
          href="/portal"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
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
