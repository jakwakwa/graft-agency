"use client";

import { type ComponentProps, forwardRef } from "react";
import { cn } from "@/lib/utils";

export type LandingSectionLinkProps = Omit<ComponentProps<"a">, "href"> & {
  sectionId: string;
};

/**
 * Same-document section navigation that works on the marketing homepage.
 * Next.js `<Link href="/#id">` often does not scroll when already on `/`; this uses
 * `scrollIntoView` and updates the hash reliably.
 */
export const LandingSectionLink = forwardRef<HTMLAnchorElement, LandingSectionLinkProps>(function LandingSectionLink(
  { sectionId, className, onClick, children, ...rest },
  ref,
) {
  return (
    <a
      ref={ref}
      href={`#${sectionId}`}
      className={cn(className)}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;

        const target = document.getElementById(sectionId);
        if (!target) return;

        e.preventDefault();
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        window.history.replaceState(null, "", `#${sectionId}`);
      }}
      {...rest}
    >
      {children}
    </a>
  );
});
