"use client";

import { Cloud, Shield } from "lucide-react";
import Image from "next/image";

export function LandingHardenedGrid() {
  return (
    <section className="py-10 sm:py-16 md:py-24 bg-surface-container-low border-y border-white/5 overflow-hidden">
      <div className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 md:gap-16 items-center">
        <div className="lg:w-1/2 space-y-6">
          <h2 className="text-lg md:text-6xl font-normal font-display text-on-surface tracking-tight">
            Built for <br />
            <span className="text-chart-1">Tenant Isolation</span>
          </h2>
          <p className="text-on-surface-variant leading-relaxed">
            GRAFT.TODAY runs on managed cloud hosting with HTTPS/TLS on every route. Your chatbot widget loads in an
            isolated iframe, and every lead, conversation, and setting stays scoped to your organisation.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-highest/50">
              <Shield className="text-primary h-10" />
              <div>
                <div className="text-sm font-bold text-on-surface">HTTPS/TLS Transport</div>
                <div className="text-xs text-on-surface-variant">
                  Chat traffic and dashboard access use encrypted HTTPS — there is no HTTP fallback.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-highest/50">
              <Cloud className="text-violet-400 h-10" />
              <div>
                <div className="text-sm font-bold text-on-surface">Isolated Widget &amp; Tenant Scope</div>
                <div className="text-xs text-on-surface-variant">
                  The embed runs in an isolated iframe and cannot access your page&apos;s DOM or cookies. Data stays
                  tenant-scoped so other organisations cannot see yours.
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:w-1/2 relative">
          <div className="relative glass-panel p-2 rounded-xl aspect-video overflow-hidden">
            <Image
              alt="Server Farm Infrastructure"
              className="object-cover rounded-lg mix-blend-overlay"
              data-alt="Futuristic dark data center with rows of sleek servers glowing with neon purple and blue lights, cinematic perspective with shallow depth of field"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4l3YpW5LLtwvRJm4b0_fXaNOzVT8Q5OVpN_UZEkrUB-P5Z3lI_oam1CyfjuVU9WwejnuAQA3UQc2rkIO20F5ciB0v_PH9pN3yJ24JslV4V4x-vWA9kiyanxL_spaihw8EEDLt9kzeUfEAp7kF48SSlgh7s2EWVcfnNtEBxZAgA4x1gSAgYflzyCkwCRaypDzVS1Fs4K1RFlafYpkBaXGRroQZ85WgdyvlQxWc8bgKf1el5m8zhZxlRIiTduiq0P544dxhDhwLqLZS"
            />
            <div className="absolute inset-0 bg-linear-to-t from-background to-transparent opacity-60"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <div className="text-[10px] text-primary font-bold tracking-widest uppercase">Security Model</div>
                  <div className="text-xl font-bold text-white">Tenant-Scoped Access</div>
                </div>
                <div className="h-12 flex items-end gap-1">
                  <div className="w-1 bg-primary h-4"></div>
                  <div className="w-1 bg-primary h-8"></div>
                  <div className="w-1 bg-primary h-6"></div>
                  <div className="w-1 bg-primary h-10"></div>
                  <div className="w-1 bg-primary h-3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
