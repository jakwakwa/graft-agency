import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background px-6 py-24 md:py-32">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, var(--primary) 0%, transparent 45%), radial-gradient(circle at 80% 70%, var(--muted-foreground) 0%, transparent 40%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-4xl text-center">
        <Typography.H1 className="font-serif text-4xl tracking-tight md:text-5xl md:leading-tight">
          AI agency automation, built for growth teams
        </Typography.H1>
        <Typography.Lead className="mx-auto mt-6 max-w-2xl text-muted-foreground">
          Graft Agency helps you qualify prospects, draft leads, and keep conversations moving—without losing the human touch.
        </Typography.Lead>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/sign-up" className={cn(buttonVariants({ variant: "default", size: "lg" }))}>
            Get started
          </Link>
          <Link href="/dashboard/automation" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            View dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
