// import glowMeshPng from "figma:asset/563d7107b540b98dd668d577a19d51e99faa12b6.png";
import {
  ArrowRight,
  Asterisk,
  AtSign,
  Calendar,
  CheckCircle2,
  Globe,
  MapPin,
  MoreHorizontal,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import svgPaths from "../../imports/Landing/svg-3bp3v10rhn";
import { Badge } from "./badge";
import { Button } from "./button";
import { CustomIcon } from "./CustomIcon";
import { Card } from "./card";
import { IconWrapper } from "./IconWrapper";
import { BodyText, EyebrowText, H1, H2, H3, H4, TextGradient } from "./Typography";

export default function LandingPageV2() {
  return (
    <div className="min-h-screen bg-[#13121b] text-[#e5e0ed] font-['Inter',sans-serif] overflow-x-hidden selection:bg-[#9888ff]/30 selection:text-white relative">
      {/* Decorative large background SVGs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <svg
          role="presentation"
          className="absolute top-0 left-0 w-full h-full opacity-40 mix-blend-screen"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 979 583"
        >
          <path d={svgPaths.p53f4d80} fill="#2F71F5" fillOpacity="0.05" />
        </svg>
        <svg
          role="presentation"
          className="absolute top-[20%] right-[-10%] w-[1065px] h-[623px] opacity-40 mix-blend-screen"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 1065 623"
        >
          <path d={svgPaths.p9436980} fill="#5810C4" fillOpacity="0.05" />
          <path d={svgPaths.p9436980} fill="#612FF5" fillOpacity="0.05" />
        </svg>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#13121b]/60 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-wider text-white">GRAFT.TODAY</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#acb1d6]">
            <Link href="#" className="text-[#fface8] hover:text-[#ffc5ac] transition-colors">
              Lead Capture
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Midnight Prospector
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              White-Label
            </Link>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link href="#" className="hover:text-white transition-colors hidden sm:block text-[#acb1d6]">
              Login
            </Link>
            <Button variant="gradient" size="sm">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-32 lg:pt-40">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pb-24 lg:pb-32 flex flex-col lg:flex-row items-center gap-16 relative">
          {/* Left Column */}
          <div className="flex-1 flex flex-col items-start gap-8 z-10">
            <Badge variant="default" pulseColor="#71a9f1">
              24/7 AI Receptionist Active
            </Badge>

            <H1>
              The Receptionist
              <br />
              <span className="font-['Ovo',serif]">That </span>
              <TextGradient gradient="primary">Never</TextGradient>
              <br />
              <TextGradient gradient="secondary">Sleeps</TextGradient>
              <span className="text-[#fface8]">.</span>
            </H1>

            <BodyText variant="large">
              Elite AI agents engineered for the South African business rhythm. Captures leads, books consultations, and
              syncs with your calendar while the city sleeps—or when the grid goes down.
            </BodyText>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
              <Button variant="default" className="w-full sm:w-auto">
                Hire Your AI Receptionist
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" className="w-full sm:w-auto">
                <ShieldCheck className="w-4 h-4 text-[#7bf7c8]" />
                <span className="text-xs uppercase tracking-wider text-left">
                  Security Standard
                  <br />
                  <span className="text-white font-bold">SHA-256 Encrypted</span>
                </span>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 mt-4 text-xs font-semibold tracking-wider text-[#8b8eab]">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-[#71a9f1]" /> ZERO LATENCY
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 text-[#fface8]" /> CALENDLY INTEGRATED
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-[#7bf7c8]" /> MILITARY GRADE
              </div>
            </div>
          </div>
          <div className="absolute  top-[0px] w-[800px] h-full  inset-0 bg-linear-to-tr  -z-10 from-[#C825E9]/10 to-[#1149f0]/20 blur-[25px] rounded-full" />

          <div className="absolute right-0 w-full  bottom-0 h-1/2 inset-0 bg-linear-to-tr  -z-12 from-[#C825E9]/10 to-[#1149f0]/20 blur-[25px] rounded-full" />

          {/* Right Column - Dashboard UI */}
          <div className="flex-1 w-full lg:w-auto relative z-10 flex justify-center lg:justify-end">
            {/* Background Glow behind Dashboard */}
            <Card variant="default" className="p-4 border-outline-ghost  w-full backdrop-blur-5xl max-w-[500px]">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-brrom-[#9888ff] to-[#e35efe] flex items-center justify-center text-white font-bold shadow-inner">
                    G
                  </div>
                  <div>
                    <H4 className="text-base">Graft AI Agent</H4>
                    <EyebrowText color="accent">STATUS: OPERATIONAL</EyebrowText>
                  </div>
                </div>
                <Button variant="ghost" className="text-white/50 hover:text-white transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </div>

              {/* Event Card */}
              <Card variant="inner" className="border-border/20  p-4 mb-4">
                <div className="absolute top-0 right-0 p-4 text-[10px] text-white/40 font-medium">2m ago</div>
                <EyebrowText color="warning" className="mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffc07e] animate-pulse" />
                  NEW EVENT CAPTURED
                </EyebrowText>
                <H4 className="mb-1">Lead Captured: Consultation</H4>
                <BodyText className="text-sm mb-4">Client: Johann vd Merwe (Cape Town)</BodyText>
                <Badge
                  variant="secondary"
                  className="px-3 py-2 rounded-lg text-xs normal-case tracking-normal font-normal"
                >
                  <Calendar className="w-3 h-3" />
                  Booked for Friday @ 14:30
                </Badge>
              </Card>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4">
                <Card variant="inner">
                  <EyebrowText color="secondary" className="mb-1">
                    Missed Leads
                  </EyebrowText>
                  <p className="text-3xl font-bold text-white">0</p>
                </Card>
                <Card variant="inner">
                  <div className="absolute inset-0 bg-linear-to-brrom-[#7bf7c8]/5 to-transparent pointer-events-none" />
                  <EyebrowText color="secondary" className="mb-1">
                    Grid Resilience
                  </EyebrowText>
                  <p className="text-3xl font-bold text-white">100%</p>
                </Card>
              </div>
            </Card>
          </div>
        </section>

        {/* High-Performance Section */}
        <section className="max-w-7xl mx-auto px-6 py-24 relative">
          <div className="flex flex-col lg:flex-row gap-12 items-center mb-16 relative">
            <div className="flex-1 lg:max-w-xl">
              <Badge variant="outline" className="mb-6">
                Current Status: Stage 0 (AI Resilience Active)
              </Badge>
              <H2 className="mb-6">
                High-Performance
                <br />
                Lead Orchestration
              </H2>
              <BodyText variant="large">
                Unlike basic chatbots, Graft AI understands intent, manages complex calendars, and operates with a local
                heartbeat.
              </BodyText>
            </div>
            <div className="flex-1 w-full relative h-[400px] lg:h-auto flex justify-center lg:justify-end items-center">
              <div className="relative w-full max-w-[500px] aspect-square mix-blend-lighten opacity-80 pointer-events-none">
                {/* <Image
                  src={glowMeshPng}
                  alt="Mesh Graphic"
                  className="w-full h-full object-contain"
                  width={500}
                  height={500}
                /> */}
              </div>
            </div>
          </div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Bento 1: Load Shedding */}
            <Card variant="bento">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-[#ffb0ac] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <IconWrapper color="rose" className="mb-6">
                <CustomIcon
                  path={svgPaths.p37c59700}
                  viewBox="0 0 26 35"
                  className="w-6 h-8 text-[#ffb0ac]"
                  fill="#FFB0AC"
                />
              </IconWrapper>
              <H3 className="mb-4">Load Shedding? Not For Us.</H3>
              <BodyText className="mb-8">
                Our infrastructure is globally distributed and cloud-hardened. When your office goes dark, your AI
                receptionist stays in the light, capturing every single prospect without a second of downtime.
              </BodyText>
              <div className="flex gap-8">
                <div>
                  <p className="text-3xl font-light text-[#ffb0ac] mb-1">0%</p>
                  <EyebrowText color="secondary">Uptime Impact</EyebrowText>
                </div>
                <div>
                  <p className="text-3xl font-light text-white mb-1">24/7</p>
                  <EyebrowText color="secondary">Lead Monitoring</EyebrowText>
                </div>
              </div>
            </Card>

            {/* Bento 2: Instant Booking */}
            <Card variant="bento">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-rrom-transparent via-[#c9bfff] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <IconWrapper color="purple" className="mb-6">
                <CustomIcon
                  path={svgPaths.p11dddd80}
                  viewBox="0 0 32 35"
                  className="w-7 h-8 text-[#c9bfff]"
                  fill="#C9BFFF"
                />
              </IconWrapper>
              <H3 className="mb-4">Instant Booking</H3>
              <BodyText className="mb-8">
                Direct integration with Calendly and Cal.com. No more back-and-forth emails. Your agent identifies
                serious leads and places them directly on your dashboard.
              </BodyText>
              <div className="space-y-3 max-w-sm">
                <div className="flex items-center justify-between bg-[#13121b] border border-white/5 rounded-xl px-4 py-3">
                  <span className="text-sm text-[#a5a9c4]">Calendly Sync</span>
                  <CheckCircle2 className="w-4 h-4 text-[#ffb0ac]" />
                </div>
                <div className="flex items-center justify-between bg-[#13121b] border border-white/5 rounded-xl px-4 py-3">
                  <span className="text-sm text-[#a5a9c4]">Cal.com Active</span>
                  <CheckCircle2 className="w-4 h-4 text-[#ffb0ac]" />
                </div>
              </div>
            </Card>

            {/* Bento 3: Local Pulse */}
            <Card variant="bento">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-rrom-transparent via-[#fface8] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <IconWrapper color="pink" className="mb-6">
                <MapPin className="w-6 h-6 text-[#fface8]" />
              </IconWrapper>
              <H3 className="mb-4">Local Pulse</H3>
              <BodyText>
                The AI understands South African nuances—from public holidays to specific regional context, making the
                lead interaction feel genuinely local and human.
              </BodyText>
            </Card>

            {/* Bento 4: Elite-Grade Security */}
            <Card variant="bento" className="flex flex-col sm:flex-row items-center gap-8">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-[#7bf7c8] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex-1">
                <H3 className="mb-4">Elite-Grade Security</H3>
                <BodyText>
                  We treat lead data like a national treasure. Every interaction is hashed with SHA-256 protocols and
                  stored behind enterprise-grade firewalls.
                </BodyText>
              </div>
              <div className="w-32 h-32 shrink-0 rounded-full border border-white/10 bg-linear-to-br from-[#13121b] to-[#1e1e28] flex flex-col items-center justify-center shadow-[0_0_30px_rgba(123,247,200,0.1)] relative">
                <div className="absolute inset-0 rounded-full border border-[#7bf7c8]/30 blur-sm" />
                <ShieldCheck className="w-10 h-10 text-[#7bf7c8] mb-2" />
                <span className="text-[10px] font-bold tracking-widest text-[#7bf7c8]">SHA-256</span>
              </div>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-32 text-center overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-[#2f2b5a]/10 to-[#13121b] pointer-events-none" />
          <div className="max-w-4xl mx-auto px-6 relative z-10">
            <H2 className="text-5xl sm:text-6xl mb-4 leading-tight">
              Ready to Scale Your
              <br />
              <TextGradient gradient="accent">Unfair Advantage?</TextGradient>
            </H2>
            <BodyText className="text-lg mb-10 max-w-2xl mx-auto">
              Stop letting revenue slip through the cracks after 5 PM. Deploy your elite AI receptionist in less than 30
              minutes.
            </BodyText>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button
                variant="link"
                className="text-white hover:text-[#fface8] font-medium flex items-center gap-2 transition-colors"
              >
                View Pricing Plans <ArrowRight className="w-4 h-4 -rotate-45" />
              </Button>
              <Button variant="default" className="w-full sm:w-auto">
                Hire Your AI Receptionist
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#13121b] border-t border-white/5 pt-20 pb-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-24 mb-16">
            <div className="md:col-span-1">
              <span className="font-bold text-lg tracking-wider text-white block mb-4">GRAFT.TODAY</span>
              <p className="text-sm text-[#a5a9c4] leading-relaxed max-w-[250px]">
                High-performance AI orchestration for elite sales teams. Engineered for the South African business
                landscape.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-6">Solutions</h4>
              <ul className="space-y-4 text-sm text-[#a5a9c4]">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Lead Capture
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Midnight Prospector
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    White-Label
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-[#a5a9c4]">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Success Stories
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-[#a5a9c4]">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 text-sm text-[#a5a9c4]">
            <p>© 2026 GRAFT.TODAY</p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <Globe className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
              <AtSign className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
              <Asterisk className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
