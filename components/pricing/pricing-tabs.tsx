"use client";

import { motion, useReducedMotion } from "motion/react";
import { startTransition, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PricingTabsProps {
  className?: string;
}

export function PricingTabs({ className }: PricingTabsProps) {
  const [activeTab, setActiveTab] = useState<"bot-pricing" | "website-pricing">("bot-pricing");
  const isReducedMotion = useReducedMotion();

  // Scroll to section handler
  const handleTabClick = (sectionId: "bot-pricing" | "website-pricing") => {
    setActiveTab(sectionId);
    const target = document.getElementById(sectionId);
    if (target) {
      const offset = 150; // Leave space for sticky header & tab switcher
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = target.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: isReducedMotion ? "auto" : "smooth",
      });
      // Update browser history hash
      window.history.replaceState(null, "", `#${sectionId}`);
    }
  };

  // Set up IntersectionObserver to update active tab based on scroll position
  useEffect(() => {
    const sections = ["bot-pricing", "website-pricing"];
    const observers = sections.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            // Trigger active state when section takes up significant part of the viewport
            if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
              startTransition(() => {
                setActiveTab(id as "bot-pricing" | "website-pricing");
              });
            }
          }
        },
        {
          rootMargin: "-25% 0px -45% 0px", // Focus area in middle of viewport
          threshold: [0.25],
        },
      );

      observer.observe(el);
      return { observer, el };
    });

    return () => {
      for (const obs of observers) {
        if (obs) obs.observer.unobserve(obs.el);
      }
    };
  }, []);

  const tabs = [
    { id: "bot-pricing", label: "AI Assistant Suite" },
    { id: "website-pricing", label: "Graft AI Agents Website Setup" },
  ] as const;

  return (
    <div
      className={cn(
        "flex justify-center items-center w-full sticky top-20 z-30 py-4 bg-[#070708]/85 backdrop-blur-md border-b border-white/5",
        className,
      )}
    >
      <div className="inline-flex rounded-full border border-white/10 bg-[#0d0d12]/90 p-1 shadow-2xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "relative rounded-full px-6 py-2.5 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-chart-3 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                isActive ? "text-white" : "text-[#acb1d6] hover:text-white",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activePricingTab"
                  transition={isReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 bg-chart-3 rounded-full z-[-1] shadow-lg shadow-chart-3/25"
                />
              )}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
