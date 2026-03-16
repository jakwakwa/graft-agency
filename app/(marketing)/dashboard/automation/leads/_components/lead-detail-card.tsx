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
          <div className="border-r border-border p-4">
            <Typography.H4 className="mb-2">Scraped Data (read-only)</Typography.H4>
            <pre className="max-h-[400px] overflow-auto rounded bg-muted p-3 text-xs">
              {JSON.stringify(scrapedData ?? {}, null, 2)}
            </pre>
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
