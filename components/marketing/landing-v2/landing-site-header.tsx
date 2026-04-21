import Link from "next/link";
import { LANDING_ROUTES, landingContainerClassName } from "./constants";
import { LandingHeaderAuth } from "./landing-header-auth";
import { LandingHeaderNav } from "./landing-header-nav";

export function LandingSiteHeader() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-white/5 bg-[#13121b]/60 backdrop-blur-xl">
      <div className={`${landingContainerClassName} flex h-20 items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Link
            href={LANDING_ROUTES.home}
            className="font-headline text-lg font-bold tracking-wider text-white transition-opacity hover:opacity-90"
          >
            GRAFT.TODAY
          </Link>
        </div>
        <div className="hidden min-w-0 flex-1 justify-center px-6 md:flex">
          <LandingHeaderNav className="w-auto" />
        </div>
        <LandingHeaderAuth />
      </div>
    </header>
  );
}
