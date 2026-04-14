"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui-v2/button";
import { LANDING_ROUTES } from "@/components/ui-v2/landing/constants";

export function LandingHeaderAuth() {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden text-[#acb1d6] hover:bg-white/5 hover:text-white sm:inline-flex"
          >
            Login
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button type="button" variant="gradient" size="sm">
            Get Started
          </Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="inline-flex shrink-0 text-xs text-[#acb1d6] hover:bg-white/5 hover:text-white sm:text-sm"
            asChild
          >
            <Link href={LANDING_ROUTES.dashboard} aria-label="Open the platform dashboard">
              Platform
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="inline-flex shrink-0 text-xs text-[#acb1d6] hover:bg-white/5 hover:text-white sm:text-sm"
            asChild
          >
            <Link href={LANDING_ROUTES.tenantDashboard} aria-label="Open the tenant dashboard">
              Tenant
            </Link>
          </Button>
          <UserButton
            appearance={{
              baseTheme: "dark",
              elements: {
                avatarBox: "h-9 w-9 ring-1 ring-white/10",
              },
            }}
          />
        </div>
      </Show>
    </div>
  );
}
