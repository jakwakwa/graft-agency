"use client";
import { CloudIcon, Shield01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";

export function LandingHardenedGrid() {
  return (
    <section className="py-10 sm:py-16 md:py-24 bg-surface-container-low border-y border-white/5 overflow-hidden">
      <div className="px-4 sm:px-6 md:px-10 max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 md:gap-16 items-center">
        <div className="lg:w-1/2 space-y-6">
          <h2 className="text-lg md:text-6xl font-normal font-display text-on-surface tracking-tight">
            Rapid Setup
            <br />
            <span className="text-chart-2 ">&amp; Secure Isolation</span>
          </h2>
          <p className="text-on-surface-variant text-lg font-light leading-relaxed">
            GRAFT.TODAY runs on managed cloud hosting securely on every route. Your installed GRAFT Ai Assistant widget
            loads in an isolated iframe, and every query, conversation, and setting stays scoped to to your own
            business.
          </p>
          <div className="space-y-8">
            <div className="flex items-start gap-4 p-0 rounded-lg bg-surface-container-highest/50">
              <HugeiconsIcon icon={Shield01Icon} className="text-secondary h-8 w-10" />
              <div>
                <div className="text-lg font-sans text-on-surface">Secure Transport</div>
                <div className="text-base mt-4 text-on-surface-variant">
                  Chat traffic and dashboard access use encrypted HTTPS — there is no HTTP fallback.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 p-0  rounded-lg bg-surface-container-highest/50">
              <HugeiconsIcon icon={CloudIcon} className="text-violet-400  w-18" />
              <div>
                <div className="text-lg font-sans leading-normal h-8 text-on-surface">
                  Isolated Widget &amp; Tenant Scope
                </div>
                <div className="text-base mt-4 text-on-surface-variant">
                  The embed runs in an isolated iframe and cannot access your page&apos;s DOM or cookies. Data stays
                  tenant-scoped so other organisations cannot see yours.
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:w-1/2  right-0 relative">
          <div className="relative glass-panel p-2 rounded-xl aspect-3/4 overflow-hidden">
            <Image
              alt="Server Farm Infrastructure"
              className="object-cover rounded-xl mix-blend-overlay"
              data-alt="Futuristic dark data center with rows of sleek servers glowing with neon purple and blue lights, cinematic perspective with shallow depth of field"
              fill
              sizes="(max-width: 1324px) 100vw, 50vw"
              src={"/ai factory.jpeg"}
            />
            <div className="absolute inset-0 bg-linear-to-t from-indigo-950 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <div className="text-[14px] text-secondary font-bold tracking-widest uppercase">Data Encrypted</div>
                  <div className="text-xl font-bold text-white">Scoped Private Access</div>
                </div>
                <div className="h-12 flex items-end gap-1">
                  <div className="w-1 bg-secondary h-4"></div>
                  <div className="w-1 bg-secondary h-4"></div>
                  <div className="w-1 bg-secondary h-4"></div>
                  <div className="w-1 bg-secondary h-4"></div>
                  <div className="w-1 bg-secondary h-3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
