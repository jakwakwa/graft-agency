"use client";

import { Cloud, Shield } from "lucide-react";
import Image from "next/image";

export function LandingHardenedGrid() {
  return (
    <section className="py-10 sm:py-16 md:py-24 bg-surface-container-low border-y border-white/5 overflow-hidden">
      <div className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 md:gap-16 items-center">
        <div className="lg:w-1/2 space-y-6">
          <h2 className="text-lg md:text-6xl font-normal font-display text-on-surface tracking-tight">
            Grid-Hardened <br />
            <span className="text-chart-1">Engineered Software</span>
          </h2>
          <p className="text-on-surface-variant leading-relaxed">
            Our platform is engineered on top of a globally distributed edge network. Every request is handled by the
            nearest data center, ensuring the <span className="text-chart-1">low latency</span> experience your premium
            clients expect.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-highest/50">
              <Shield className="text-primary h-10" />
              <div>
                <div className="text-sm font-bold text-on-surface">Military-Grade Encryption</div>
                <div className="text-xs text-on-surface-variant">
                  All customer data is AES-256 encrypted at rest and in transit.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-highest/50">
              <Cloud className="text-violet-400 h-10" />
              <div>
                <div className="text-sm font-bold text-on-surface">Serverless Elasticity</div>
                <div className="text-xs text-on-surface-variant">
                  Instant scaling from 1 to 1,000,000 requests per second.
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
                  <div className="text-[10px] text-primary font-bold tracking-widest uppercase">Global Node Map</div>
                  <div className="text-xl font-bold text-white">Active Traffic</div>
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
