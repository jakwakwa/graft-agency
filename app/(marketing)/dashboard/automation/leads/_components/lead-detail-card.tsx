"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import Link from "next/link";
import { X, XCircle } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4  backdrop-blur-[50px] ">
      <div className="flex max-h-[99vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border glass-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Typography.H3> {customerName ?? "Unknown"}</Typography.H3>
          <Button variant="default" size="lg" onClick={onClose}>
            <p className="sr-only">Close</p>
            <XCircle />
          </Button>
        </div>

        <div className="border-r border-border p-4 overflow-auto">
          {scrapedData?.businessDescription ? (
            <div className="space-y-1 grid grid-cols-6 gap-3">
              <div className="flex flex-col col-span-2">
                <div className="flex gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 border-[1.5px] bg-white/50 text-xs font-medium ${scrapedData.hasChatbot ? "bg-yellow-400/5 border-amber-400 text-amber-400" : "bg-emerald-700/50 text-emerald-400"}`}
                  >
                    {scrapedData.hasChatbot ? "Has Chatbot" : "No Chatbot"}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 border-[1.5px] bg-white/5 text-xs font-medium ${scrapedData.hasVoiceAgent ? "bg-yellow-400/5 border-amber-400 text-amber-400" : "bg-emerald-900/5 border-emerald-400 text-emerald-400"}`}
                  >
                    {scrapedData.hasVoiceAgent ? "Has Voice Agent" : "No Voice Agent"}
                  </span>
                </div>
              </div>
              <div className="rounded-md col-span-4">
                <p className=" text-sm text-foreground">{scrapedData.businessDescription}</p>
              </div>

              {scrapedData.coreServices && scrapedData.coreServices.length > 0 && (
                <div className="col-span-6">
                  <p className="font-medium text-sm text-muted-foreground">Services</p>
                  <ul className="text-blue-300">
                    {scrapedData.coreServices.map((s) => (
                      <li key={s.name} className="text-sm">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground"> — {s.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {scrapedData.painPoints && scrapedData.painPoints.length > 0 && (
                <div className="col-span-6 my-2">
                  <p className="font-semibold text-primary text-sm">Pain Points</p>
                  <ul className="mt-1 list-disc pl-4 space-y-1">
                    {scrapedData.painPoints.map((p) => (
                      <li key={p} className="text-sm text-foreground/80 font-medium">
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {scrapedData.targetOutreachAngle && (
                <div className="rounded-md border border-blue-100 bg-blue-500 p-3">
                  <p className="font-medium text-blue-800">Outreach Angle</p>
                  <Typography.P className="mt-1 text-sm text-blue-900">{scrapedData.targetOutreachAngle}</Typography.P>
                </div>
              )}

              {scrapedData.websiteUrl && (
                <div className="my-0 rounded-md col-span-6">
                  <p className="mt-3 text-sm">
                    <Link
                      href={scrapedData.websiteUrl}
                      target="_blank"
                      prefetch
                      rel="noopener noreferrer"
                      className="text-secondary hover:underline"
                    >
                      {scrapedData.websiteUrl}
                    </Link>
                  </p>
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
        <div className="grid grid-cols-8 p-4 gap-3">
          <Input
            className="mb-4 rounded border border-input bg-background px-3 py-2 text-sm col-span-3"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Draft subject"
            id="subject"
          />
          <Label className="mb-1 hidden text-sm col-span-0 font-medium" htmlFor="body">
            Body
          </Label>
          <Textarea
            className=" max-h-[100px] flex-1 rounded border border-input bg-background px-3 py-2 text-sm col-span-5"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Draft body"
            id="body"
          />
          <div className="flex gap-2 col-span-2">
            <Button variant="secondary" size="lg" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Draft"}
            </Button>
            <Button variant="default" size="lg" onClick={() => onApprove(id)}>
              Approve
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
