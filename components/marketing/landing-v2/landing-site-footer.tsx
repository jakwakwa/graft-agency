import { Asterisk, AtSign, Globe, XIcon } from "lucide-react";
import Link from "next/link";
import { Typography } from "@/components/ui/typography";
import { LANDING_HEADER_SECTIONS, LANDING_ROUTES, landingContainerClassName } from "./constants";
import { LandingSectionLink } from "./landing-section-link";
import { Button } from "@/components/ui-v2/button";
import { XingIcon } from "@hugeicons/core-free-icons";
import Image from "next/image"
const footerLinkClass = "text-sm text-[#a5a9c4] transition-colors hover:text-white";

export function LandingSiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-[#13121b] pt-10 pb-8 md:pt-20 md:pb-10">
      <div className={landingContainerClassName}>
        <div className="mb-12 md:mb-16 grid grid-cols-2 gap-8 md:grid-cols-3 lg:gap-20">
          <div className="col-span-2 md:col-span-1">
            <span className="mb-4 block text-lg font-bold tracking-wider text-white">GRAFT.TODAY</span>
            <Typography.P className="max-w-[250px] text-sm leading-relaxed">
              An inbound website assistant that answers visitor enquiries, captures leads with consent, and books
              appointments — so your team can follow up when it matters.
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
              <li>
                <Link href={LANDING_ROUTES.refunds} className={footerLinkClass}>
                  Refund &amp; cancellation policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-sm text-[#a5a9c4] md:flex-row md:gap-0">
          <p>© 2026 GRAFT.TODAY</p>
          <div className="flex items-center gap-6">
           <Button className="m-0 p-0 w-8 h-8 bg-transparent hover:bg-white/15">
            <Link href={"https://x.com/graft2day"} target="_blank">
            <Image src={`XLogo.svg`} alt="X Logo" width={48} height={48} className="h-8 w-8 p-1 cursor-pointer transition-colors hover:text-white" aria-hidden />
        
            </Link></Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
