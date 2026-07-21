"use client";
import { GlobeIcon, Mail01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { getLeadPipelineStatus } from "@/lib/utils/lead-pipeline-status";
import { PipelineStatusBadge } from "../../_components/status-badges";
import type { LeadItem } from "./types";

interface LeadCardProps {
  lead: LeadItem;
  isSelected: boolean;
  onSelect: (lead: LeadItem) => void;
}

export function LeadCard({ lead, isSelected, onSelect }: LeadCardProps) {
  const pipelineStatus = getLeadPipelineStatus({
    leadStatus: lead.status,
    engagementStage: lead.engagement?.stage ?? null,
  });

  return (
    <button
      type="button"
      onClick={() => onSelect(lead)}
      className={`w-full text-left p-6 transition-all duration-300 rounded-xl border border-outline-ghost/10 backdrop-blur-md cursor-pointer ${
        isSelected
          ? "border-l-4 border-l-primary bg-card/75 shadow-md scale-[1.01]"
          : "border-l-4 border-l-muted/30 bg-card/25 hover:border-l-primary/40 hover:bg-card/50"
      }`}
    >
      <div className="space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-foreground leading-tight">{lead.customerName ?? "Unknown Lead"}</h4>
            <p className="text-[10.5px] text-muted-foreground truncate max-w-[24ch]">
              {lead.scrapedData?.websiteUrl || "No website audit"}
            </p>
          </div>
          <PipelineStatusBadge status={pipelineStatus} />
        </div>

        <div className="flex items-center gap-4 text-[10px] text-muted-foreground border-t border-outline-ghost/10 pt-2.5">
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={GlobeIcon} className="h-3.5 w-3.5 text-secondary" />
            {lead.scrapedData?.hasChatbot ? "Has Chatbot" : "No Chatbot"}
          </span>
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={Mail01Icon} className="h-3.5 w-3.5 text-accent" />
            {lead.scrapedData?.hasVoiceAgent ? "Has Voice" : "No Voice"}
          </span>
        </div>
      </div>
    </button>
  );
}
