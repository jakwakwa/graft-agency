"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";

interface ScrapedData {
  websiteUrl?: string;
  draftSubject?: string;
  draftBody?: string;
  hasChatbot?: boolean;
  hasVoiceAgent?: boolean;
  businessDescription?: string;
  coreServices?: Array<{ name: string; description: string }>;
  painPoints?: string[];
  targetOutreachAngle?: string;
  [key: string]: unknown;
}

interface LeadDetailCardProps {
  id: string;
  customerName: string | null;
  scrapedData: ScrapedData | null;
  onApprove: (id: string) => void;
  onSave: (id: string, scrapedData: { draftSubject?: string; draftBody?: string }) => Promise<void>;
  onClose: () => void;
}

export function LeadDetailCard({ id, customerName, scrapedData, onApprove, onSave, onClose }: LeadDetailCardProps) {
  const draft = scrapedData ?? {};
  const [subject, setSubject] = useState(draft.draftSubject ?? "");
  const [body, setBody] = useState(draft.draftBody ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(id, { draftSubject: subject, draftBody: body });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Typography.H3>Prospect Triage: {customerName ?? "Unknown"}</Typography.H3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="grid flex-1 overflow-auto md:grid-cols-2">
          <div className="border-r border-border p-4 overflow-auto">
            <Typography.H4 className="mb-2">Prospect Audit</Typography.H4>
            {scrapedData?.businessDescription ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${scrapedData.hasChatbot ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                    {scrapedData.hasChatbot ? "Has Chatbot" : "No Chatbot"}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${scrapedData.hasVoiceAgent ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                    {scrapedData.hasVoiceAgent ? "Has Voice Agent" : "No Voice Agent"}
                  </span>
                </div>

                <div>
                  <Typography.Small className="font-medium text-muted-foreground">About</Typography.Small>
                  <Typography.P className="mt-1 text-sm">{scrapedData.businessDescription}</Typography.P>
                </div>

                {scrapedData.coreServices && scrapedData.coreServices.length > 0 && (
                  <div>
                    <Typography.Small className="font-medium text-muted-foreground">Services</Typography.Small>
                    <ul className="mt-1 space-y-1">
                      {scrapedData.coreServices.map((s, i) => (
                        <li key={i} className="text-sm">
                          <span className="font-medium">{s.name}</span>
                          <span className="text-muted-foreground"> — {s.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {scrapedData.painPoints && scrapedData.painPoints.length > 0 && (
                  <div>
                    <Typography.Small className="font-medium text-muted-foreground">Pain Points</Typography.Small>
                    <ul className="mt-1 list-disc pl-4 space-y-1">
                      {scrapedData.painPoints.map((p, i) => (
                        <li key={i} className="text-sm">{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {scrapedData.targetOutreachAngle && (
                  <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                    <Typography.Small className="font-medium text-blue-800">Outreach Angle</Typography.Small>
                    <Typography.P className="mt-1 text-sm text-blue-900">{scrapedData.targetOutreachAngle}</Typography.P>
                  </div>
                )}

                {scrapedData.websiteUrl && (
                  <div>
                    <Typography.Small className="font-medium text-muted-foreground">Website</Typography.Small>
                    <Typography.P className="mt-1 text-sm">
                      <a href={scrapedData.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {scrapedData.websiteUrl}
                      </a>
                    </Typography.P>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <Typography.P>No audit data available.</Typography.P>
                {scrapedData && Object.keys(scrapedData).length > 0 && (
                  <pre className="mt-2 max-h-[300px] overflow-auto rounded bg-muted p-3 text-xs">
                    {JSON.stringify(scrapedData, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col p-4">
            <Typography.H4 className="mb-2">Edit Draft</Typography.H4>
            <Label className="mb-1 text-sm font-medium" htmlFor="subject">
              Subject
            </Label>
            <Input
              className="mb-4 rounded border border-input bg-background px-3 py-2 text-sm"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Draft subject"
              id="subject"
            />
            <Label className="mb-1 text-sm font-medium" htmlFor="body">
              Body
            </Label>
            <Textarea
              className="mb-4 min-h-[200px] flex-1 rounded border border-input bg-background px-3 py-2 text-sm"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Draft body"
              id="body"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Draft"}
              </Button>
              <Button variant="default" size="sm" onClick={() => onApprove(id)}>
                Approve
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
