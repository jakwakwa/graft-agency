import { CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui-v2/card";

import svgPaths from "@/imports/Landing/svg-3bp3v10rhn";
import { CustomIcon } from "@/components/ui/custom-icon";
import { IconWrapper } from "@/components/ui/icon-wrapper";
import { Typography } from "@/components/ui/typography";

export function LandingBentoGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card variant="bento" className="group relative">
        <div className="absolute top-0 left-0 h-1 w-full bg-linear-to-r from-transparent via-[#fca6a2] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <IconWrapper color="rose" className="mb-6">
          <CustomIcon path={svgPaths.p37c59700} viewBox="0 0 26 35" className="h-8 w-6 text-[#ffb0ac]" fill="#FFB0AC" />
        </IconWrapper>
        <h3 className="mb-4">Load Shedding? Not For Us.</h3>
        <p className="mb-8">
          Our infrastructure is globally distributed and cloud-hardened. When your office goes dark, your AI
          receptionist stays in the light, capturing every single prospect without a second of downtime.
        </p>
        <div className="flex gap-8">
          <div>
            <p className="mb-1 text-3xl font-light text-[#ffb0ac]">0%</p>
            <Typography.Small color="secondary">Uptime Impact</Typography.Small>
          </div>
          <div>
            <p className="mb-1 text-3xl font-light text-white">24/7</p>
            <Typography.Small color="secondary">Lead Monitoring</Typography.Small>
          </div>
        </div>
      </Card>

      <Card variant="bento" className="group relative">
        <div className="absolute top-0 left-0 h-1 w-full bg-linear-to-r from-transparent via-[#c9bfff] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <IconWrapper color="purple" className="mb-6">
          <CustomIcon path={svgPaths.p11dddd80} viewBox="0 0 32 35" className="h-8 w-7 text-[#c9bfff]" fill="#C9BFFF" />
        </IconWrapper>
        <Typography.H3 className="mb-4">Instant Booking</Typography.H3>
        <Typography.P className="mb-8">
          Direct integration with Calendly and Cal.com. No more back-and-forth emails. Your agent identifies serious
          leads and places them directly on your dashboard.
        </Typography.P>
        <div className="max-w-sm space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-[#13121b] px-4 py-3">
            <span className="text-sm text-[#a5a9c4]">Calendly Sync</span>
            <CheckCircle2 className="h-4 w-4 text-[#ffb0ac]" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-[#13121b] px-4 py-3">
            <span className="text-sm text-[#a5a9c4]">Cal.com Active</span>
            <CheckCircle2 className="h-4 w-4 text-[#ffb0ac]" />
          </div>
        </div>
      </Card>

      <Card variant="bento" className="group relative">
        <div className="absolute top-0 left-0 h-1 w-full bg-linear-to-r from-transparent via-[#fface8] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <IconWrapper color="pink" className="mb-6">
          <MapPin className="h-6 w-6 text-[#fface8]" />
        </IconWrapper>
        <Typography.H3 className="mb-4">Local Pulse</Typography.H3>
        <Typography.P>
          The AI understands South African nuances—from public holidays to specific regional context, making the lead
          interaction feel genuinely local and human.
        </Typography.P>
      </Card>

      <Card variant="bento" className="group relative flex flex-col items-center gap-8 sm:flex-row">
        <div className="absolute top-0 left-0 h-1 w-full bg-linear-to-r from-transparent via-[#7bf7c8] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="flex-1">
          <Typography.H3 className="mb-4">Elite-Grade Security</Typography.H3>
          <Typography.P>
            We treat lead data like a national treasure. Every interaction is hashed with SHA-256 protocols and stored
            behind enterprise-grade firewalls.
          </Typography.P>
        </div>
        <div className="relative flex h-32 w-32 shrink-0 flex-col items-center justify-center rounded-full border border-white/10 bg-linear-to-br from-[#13121b] to-[#1e1e28] shadow-[0_0_30px_rgba(123,247,200,0.1)]">
          <div className="absolute inset-0 rounded-full border border-[#7bf7c8]/30 blur-sm" />
          <ShieldCheck className="relative mb-2 h-10 w-10 text-[#7bf7c8]" />
          <span className="relative text-[10px] font-bold tracking-widest text-[#7bf7c8]">SHA-256</span>
        </div>
      </Card>
    </div>
  );
}
