import Link from "next/link";
import { Typography } from "@/components/ui/typography";

const footerLinks = [
  { href: "/dashboard/automation", label: "Dashboard" },
  { href: "/dashboard/automation/queue", label: "Prospect queue" },
  { href: "/dashboard/automation/leads", label: "Draft leads" },
  { href: "/portal", label: "Portal" },
] as const;

const legalLinks = [
  { href: "/refunds", label: "Refund & Cancellation Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
] as const;

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <Typography.Large className="font-serif">GRAFT TODAY</Typography.Large>
          <Typography.Muted className="mt-2 max-w-sm">
            Multi-tenant AI for agencies that want reliable automation and a clear hand-off to humans.
          </Typography.Muted>
        </div>
        <div className="flex flex-col gap-8 sm:flex-row sm:gap-12">
          <nav aria-label="Footer">
            <ul className="flex flex-col gap-2">
              {footerLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Legal">
            <Typography.Small className="mb-2 block uppercase tracking-wider text-muted-foreground/70">
              Legal
            </Typography.Small>
            <ul className="flex flex-col gap-2">
              {legalLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      <Typography.Small className="mx-auto mt-10 block max-w-5xl text-center text-muted-foreground">
        © {new Date().getFullYear()} Graft Agency. All rights reserved.
      </Typography.Small>
    </footer>
  );
}
