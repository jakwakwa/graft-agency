"use client";

import { Link2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  type EngagementLinkOption,
  type EngagementLinkType,
  getEngagementLinks,
} from "@/lib/utils/lead-pipeline-status";
import type { LeadEngagement } from "./types";

interface DraftLinkSelectorProps {
  engagement: LeadEngagement;
  onInsert: (href: string) => void;
}

function LinkOptionRow({
  id,
  value,
  label,
  option,
  failedLabel,
}: {
  id: string;
  value: EngagementLinkType;
  label: string;
  option: EngagementLinkOption;
  failedLabel: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <RadioGroupItem id={id} value={value} disabled={!option.ready} />
      <Label
        htmlFor={id}
        className={cn("text-xs font-semibold text-foreground", !option.ready && "text-muted-foreground/60")}
      >
        {label}
      </Label>
      {option.failed && (
        <span className="text-[9px] font-bold uppercase tracking-widest text-destructive">{failedLabel}</span>
      )}
    </div>
  );
}

/**
 * Prototype-link picker for the draft email body. Renders only once the
 * pipeline has produced at least one shareable artifact: the deployed Jules
 * build, or the chosen Stitch design concept as an HTML fallback (used when
 * the build failed or has not shipped). Exactly one link type is selectable.
 */
export function DraftLinkSelector({ engagement, onInsert }: DraftLinkSelectorProps) {
  const links = getEngagementLinks(engagement);
  const defaultType: EngagementLinkType | null = links.build.ready ? "build" : links.fallback.ready ? "fallback" : null;
  const [linkType, setLinkType] = useState<EngagementLinkType | null>(defaultType);

  if (!links.build.href && !links.fallback.href) return null;

  const selected = linkType ? links[linkType] : null;

  const handleInsert = () => {
    if (!selected?.href) return;
    // Same-origin proxy paths must be absolute inside an outbound email.
    const href = selected.href.startsWith("/") ? `${window.location.origin}${selected.href}` : selected.href;
    onInsert(href);
  };

  return (
    <div className="rounded-xl border border-outline-ghost/10 bg-muted/10 p-4 space-y-3">
      <Label className="text-xs font-bold uppercase tracking-wider text-foreground">Prototype Link</Label>
      <RadioGroup
        value={linkType ?? ""}
        onValueChange={(next) => setLinkType(next as EngagementLinkType)}
        className="gap-2"
      >
        <LinkOptionRow
          id="draft-link-build"
          value="build"
          label="Ready to send (build)"
          option={links.build}
          failedLabel="Build failed"
        />
        <LinkOptionRow
          id="draft-link-fallback"
          value="fallback"
          label="Ready to send (fallback)"
          option={links.fallback}
          failedLabel="Design failed"
        />
      </RadioGroup>
      <Button
        variant="outline"
        size="sm"
        className="text-xs font-bold uppercase tracking-wider"
        onClick={handleInsert}
        disabled={!selected?.ready}
      >
        <Link2 className="h-3.5 w-3.5 mr-2" />
        Insert link into draft
      </Button>
    </div>
  );
}
