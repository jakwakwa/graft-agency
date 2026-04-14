import { Calendar, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card } from "@/components/ui-v2/card";
import { BodyText, EyebrowText, H4 } from "@/components/ui-v2/Typography";

export function HeroDashboardPreview() {
  return (
    <div className="flex w-full justify-center lg:justify-end">
      <Card variant="default" className="border-outline-ghost w-full max-w-[500px] backdrop-blur-5xl p-4">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-[#9888ff] to-[#e35efe] text-sm font-bold text-white shadow-inner">
              G
            </div>
            <div>
              <H4 className="text-base">Graft AI Agent</H4>
              <EyebrowText color="accent">STATUS: OPERATIONAL</EyebrowText>
            </div>
          </div>
          <Button variant="ghost" className="text-white/50 transition-colors hover:text-white">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>

        <Card variant="inner" className="relative mb-4 border-border/20 p-4">
          <div className="absolute top-0 right-0 p-4 text-[10px] font-medium text-white/40">2m ago</div>
          <EyebrowText color="warning" className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ffc07e]" />
            NEW EVENT CAPTURED
          </EyebrowText>
          <H4 className="mb-1">Lead Captured: Consultation</H4>
          <BodyText className="mb-4 text-sm">Client: Johann vd Merwe (Cape Town)</BodyText>
          <Badge variant="secondary" className="rounded-lg px-3 py-2 text-xs font-normal tracking-normal normal-case">
            <Calendar className="h-3 w-3" />
            Booked for Friday @ 14:30
          </Badge>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card variant="inner">
            <EyebrowText color="secondary" className="mb-1">
              Missed Leads
            </EyebrowText>
            <p className="text-3xl font-bold text-white">0</p>
          </Card>
          <Card variant="inner" className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-[#7bf7c8]/5 to-transparent" />
            <EyebrowText color="secondary" className="relative mb-1">
              Grid Resilience
            </EyebrowText>
            <p className="relative text-3xl font-bold text-white">100%</p>
          </Card>
        </div>
      </Card>
    </div>
  );
}
