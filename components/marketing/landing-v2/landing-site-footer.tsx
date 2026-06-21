import { Asterisk, AtSign, Globe } from "lucide-react";
import Link from "next/link";
import { Typography } from "@/components/ui/typography";
import { LANDING_HEADER_SECTIONS, LANDING_ROUTES, landingContainerClassName } from "./constants";
import { LandingSectionLink } from "./landing-section-link";

const footerLinkClass = "text-sm text-[#a5a9c4] transition-colors hover:text-white";

export function LandingSiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-[#13121b] pt-10 pb-8 md:pt-20 md:pb-10">
      <div className={landingContainerClassName}>
        <div className="mb-12 md:mb-16 grid grid-cols-2 gap-8 md:grid-cols-3 lg:gap-20">
          <div className="col-span-2 md:col-span-1">
            <span className="mb-4 block text-lg font-bold tracking-wider text-white">GRAFT.TODAY</span>
            <Typography.P className="max-w-[250px] text-sm leading-relaxed">
              High-performance AI orchestration for elite sales teams. Engineered for the South African business
              landscape.
            </Typography.P>
          </div>

          <div>
            <Typography.H4 className="mb-6 text-xs font-bold tracking-wider text-white uppercase">
              Solutions
            </Typography.H4>
            <ul className="space-y-4">
              {LANDING_HEADER_SECTIONS.map((item) => (
                <li key={item.id}>
                  <LandingSectionLink sectionId={item.id} className={footerLinkClass}>
                    {item.label}
                  </LandingSectionLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Typography.H4 className="mb-6 text-xs font-bold tracking-wider text-white uppercase">Legal</Typography.H4>
            <ul className="space-y-4">
              <li>
                <Link href={LANDING_ROUTES.privacy} className={footerLinkClass}>
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href={LANDING_ROUTES.terms} className={footerLinkClass}>
                  Terms of service
                </Link>
              </li>
              <li>
                <Link href={LANDING_ROUTES.security} className={footerLinkClass}>
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-sm text-[#a5a9c4] md:flex-row md:gap-0">
          <p>© 2026 GRAFT.TODAY</p>
          <div className="flex items-center gap-6">
            <Globe className="h-4 w-4 cursor-pointer transition-colors hover:text-white" aria-hidden />
            <AtSign className="h-4 w-4 cursor-pointer transition-colors hover:text-white" aria-hidden />
            <Asterisk className="h-4 w-4 cursor-pointer transition-colors hover:text-white" aria-hidden />
          </div>
        </div>
      </div>
    </footer>
  );
}
