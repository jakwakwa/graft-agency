import {
  Delete02Icon,
  FileAttachmentIcon,
  FloppyDiskIcon,
  LinkSquare01Icon,
  Loading02Icon,
  Mail01Icon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import type React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { PipelineStatusBadge } from "../../_components/status-badges";
import { DraftLinkSelector } from "./draft-link-selector";
import type { LeadItem } from "./types";

interface DraftWorkspaceProps {
  lead: LeadItem | null;
  subject: string;
  setSubject: (val: string) => void;
  body: string;
  setBody: React.Dispatch<React.SetStateAction<string>>;
  saving: boolean;
  approving: boolean;
  deleting: boolean;
  sending: boolean;
  actionPending: boolean;
  canApprove: boolean;
  canSendEmail: boolean;
  pipelineStatus: "draft" | "approved" | "failed" | "denied" | null;
  onSave: (id: string) => void;
  onApprove: (id: string) => void;
  onSendEmail: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DraftWorkspace({
  lead,
  subject,
  setSubject,
  body,
  setBody,
  saving,
  approving,
  deleting,
  sending,
  actionPending,
  canApprove,
  canSendEmail,
  pipelineStatus,
  onSave,
  onApprove,
  onSendEmail,
  onDelete,
}: DraftWorkspaceProps) {
  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-full border border-dashed border-outline-ghost/20 rounded-[2.5rem] py-24 text-center text-muted-foreground bg-card/10">
        <div className="w-12 h-12 rounded-full border border-outline-ghost/10 flex items-center justify-center mb-4 bg-muted/20">
          <HugeiconsIcon icon={FileAttachmentIcon} className="h-5 w-5 text-muted-foreground/60" />
        </div>
        <Typography.H4 className="text-sm font-bold text-foreground">Select a draft</Typography.H4>
        <p className="text-[11px] text-muted-foreground/60 max-w-[240px] mt-1 leading-relaxed">
          Choose a pending prospect draft from the left queue to begin your human-in-the-loop review.
        </p>
      </div>
    );
  }

  const matchIndustries = lead.scrapedData?.industries;
  const matchLocations = lead.scrapedData?.locations;
  const formatMatchList = (value: unknown) => (Array.isArray(value) ? value.join(", ") : String(value));

  return (
    <div className="space-y-6">
      <Typography.H4 className="text-xs font-bold uppercase tracking-widest text-accent">Draft Workspace</Typography.H4>
      <div className="p-1.5 rounded-[2.5rem] sm:bg-transparent md:bg-linear-to-tr from-primary/10 to-accent/10 ring-1 ring-white/10 dark:ring-white/10 shadow-xl">
        <div className="p-8 rounded-[calc(2.5rem-0.375rem)] bg-card/50 backdrop-blur-md space-y-6">
          {/* Lead Title Block */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-ghost/10 pb-5">
            <div className="space-y-1">
              <Typography.H2 className="text-xl font-bold text-foreground mt-0 mb-0">
                {lead.customerName ?? "Unknown Prospect"}
              </Typography.H2>
              {lead.scrapedData?.websiteUrl && (
                <Link
                  href={lead.scrapedData.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] mt-4 font-bold uppercase tracking-widest hover:text-accent/50 flex items-center gap-1 transition-colors"
                >
                  <HugeiconsIcon icon={LinkSquare01Icon} className="h-3 w-3 text-primary dark:text-primary-kinetic" />
                  Visit Website
                </Link>
              )}
            </div>
          </div>

          {/* Audit Summary Details */}
          <div className="space-y-4">
            {lead.scrapedData?.businessDescription && (
              <div className="bg-linear-to-r from-primary/10 via-accent/20 to-accent/10 border border-outline-ghost/10 rounded-xl p-4 space-y-1.5 shadow-lg">
                <Label className="text-sm font-bold uppercase tracking-wider text-orange-300">Company Intel</Label>
                <p className="text-sm text-foreground/80 leading-relaxed font-semibold">
                  {lead.scrapedData.businessDescription}
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-muted border-2 border-primary/10 rounded-xl p-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Chatbot Detector</span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border-2 shadow-md ${lead.scrapedData?.websiteUrl ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-primary/10 text-primary border-primary/20"}`}
                >
                  {lead.scrapedData?.websiteUrl ? "None detected" : "Graft AI Agent Present"}
                </span>
              </div>

              <div className="bg-muted border-2 border-primary/10 rounded-xl p-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Decision State</span>
                {pipelineStatus && <PipelineStatusBadge status={pipelineStatus} />}
              </div>
            </div>

            {Boolean(matchIndustries || matchLocations) && (
              <div className="p-4 rounded-xl border border-outline-ghost/10 bg-muted/10 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground text-[11px]">Match Context:</p>
                {Boolean(matchIndustries) && <p>• Industries: {formatMatchList(matchIndustries)}</p>}
                {Boolean(matchLocations) && <p>• Locations: {formatMatchList(matchLocations)}</p>}
              </div>
            )}
          </div>

          {/* Email Compose Area */}
          <div className="space-y-4 border-t border-outline-ghost/10 pt-6">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-xs font-bold text-foreground">
                Email Subject Line
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Collaboration Proposal - Graft Today"
                className="bg-background border-outline-ghost/20 focus-visible:ring-primary text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valuePropBody" className="text-xs font-bold text-foreground">
                Email Draft Body
              </Label>
              <Textarea
                id="valuePropBody"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type outreach email..."
                rows={10}
                className="bg-background border-outline-ghost/20 focus-visible:ring-primary text-sm leading-relaxed resize-none"
              />
            </div>

            {lead.engagement && (
              <DraftLinkSelector
                key={lead.id}
                engagement={lead.engagement}
                onInsert={(href) => {
                  setBody((prev) => (prev.trim() ? `${prev}\n\n${href}` : href));
                  toast.success("Prototype link inserted into draft.");
                }}
              />
            )}
          </div>

          {/* Action Panel Buttons (Bento Style row) */}
          <div className="pt-4 border-t border-outline-ghost/10 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="lg"
              className="sm:flex-1 h-11 text-xs font-bold uppercase tracking-wider active:scale-[0.98] transition-all duration-300"
              onClick={() => onSave(lead.id)}
              disabled={actionPending}
            >
              {saving ? (
                <>
                  <HugeiconsIcon icon={Loading02Icon} className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={FloppyDiskIcon} className="h-4 w-4 mr-2" />
                  Save Draft
                </>
              )}
            </Button>

            {canApprove && (
              <Button
                variant="default"
                size="lg"
                className="sm:flex-1 h-11 bg-primary text-primary-foreground font-bold uppercase tracking-wider shadow-neon active:scale-[0.98] transition-all duration-300"
                onClick={() => onApprove(lead.id)}
                disabled={actionPending}
              >
                {approving ? (
                  <>
                    <HugeiconsIcon icon={Loading02Icon} className="h-4 w-4 animate-spin mr-2" />
                    Approving...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={SentIcon} className="h-4 w-4 mr-2" />
                    Approve Engagement
                  </>
                )}
              </Button>
            )}

            {canSendEmail && (
              <Button
                variant="default"
                size="lg"
                className="sm:flex-1 h-11 bg-primary text-primary-foreground font-bold uppercase tracking-wider shadow-neon active:scale-[0.98] transition-all duration-300"
                onClick={() => onSendEmail(lead.id)}
                disabled={actionPending}
              >
                {sending ? (
                  <>
                    <HugeiconsIcon icon={Loading02Icon} className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Mail01Icon} className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-[0.95] transition-all duration-300"
              onClick={() => onDelete(lead.id)}
              disabled={actionPending}
              title="Delete and Decline"
            >
              {deleting ? (
                <HugeiconsIcon icon={Loading02Icon} className="h-4 w-4 animate-spin" />
              ) : (
                <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
