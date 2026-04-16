"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { LANDING_HEADER_SECTIONS } from "./constants";
import { LandingSectionLink } from "./landing-section-link";

const linkClassName = cn(
  navigationMenuTriggerStyle(),
  "h-10 px-3 text-sm font-medium text-[#acb1d6] transition-colors hover:text-white",
);

type LandingHeaderNavProps = {
  className?: string;
};

export function LandingHeaderNav({ className }: LandingHeaderNavProps) {
  return (
    <NavigationMenu className={cn("w-full max-w-none justify-start", className)}>
      <NavigationMenuList className="w-full flex-wrap justify-start gap-1">
        {LANDING_HEADER_SECTIONS.map((item) => (
          <NavigationMenuItem key={item.id}>
            <LandingSectionLink sectionId={item.id} className={linkClassName}>
              {item.label}
            </LandingSectionLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
