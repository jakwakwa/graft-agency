import { HugeiconsIcon } from "@hugeicons/react";
import { LockIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui-v2/button";

interface SubscriptionGateProps {
  /** Feature-specific headline, e.g. "Unlock your bot settings". */
  title: string;
  /** Tailored marketing copy explaining the benefit of subscribing. */
  description: string;
  /** Short benefit bullets rendered under the description. */
  highlights?: string[];
  children: ReactNode;
}

/**
 * Category A paygate: renders the underlying screen for context but makes it
 * inert (no clicks, no selection, no focus) and overlays a dialogue card with
 * a single "Subscribe to Graft AI Agent" call to action.
 */
export function SubscriptionGate({ title, description, highlights, children }: SubscriptionGateProps) {
  return (
    <div className="relative min-h-[60vh]">
      <div inert aria-hidden className="pointer-events-none select-none opacity-40 blur-[2px]">
        {children}
      </div>

      <div className="absolute inset-0 z-20 flex items-start justify-center px-4 pt-16 sm:pt-24">
        <Card className="w-full max-w-md border-primary/20 shadow-2xl backdrop-blur">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <HugeiconsIcon icon={LockIcon} className="h-6 w-6 text-primary" />
            </span>
            <Typography.H3 className="m-0">{title}</Typography.H3>
            <Typography.Muted className="leading-relaxed">{description}</Typography.Muted>
            {highlights && highlights.length > 0 ? (
              <ul className="m-0 list-none space-y-2 p-0 text-sm text-muted-foreground">
                {highlights.map((highlight) => (
                  <li key={highlight} className="flex items-center justify-center gap-2">
                    <HugeiconsIcon icon={SparklesIcon} className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <Button asChild size="lg" className="mt-2 w-full font-semibold">
              <Link href="/portal/billing">Subscribe to Graft AI Agent</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
