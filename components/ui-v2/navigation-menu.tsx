"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPositioner,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

type TopNavigationItem = {
  href: string;
  label: string;
};

type TopNavigationMenuProps = {
  items: TopNavigationItem[];
  className?: string;
};

/**
 * Header-ready navigation composition for ui-v2 pages.
 * Uses the shared shadcn/base-nova primitives while keeping layout predictable.
 */
export function TopNavigationMenu({ items, className }: TopNavigationMenuProps) {
  return (
    <NavigationMenu className={cn("w-full max-w-none justify-start", className)}>
      <NavigationMenuList className="w-full flex-wrap justify-start gap-1">
        {items.map((item) => (
          <NavigationMenuItem key={item.label}>
            <Link
              href={item.href}
              className={cn(
                navigationMenuTriggerStyle(),
                "h-10 px-3 text-sm font-medium text-[#acb1d6] transition-colors hover:text-white",
              )}
            >
              {item.label}
            </Link>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
