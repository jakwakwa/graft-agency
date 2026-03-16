"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Typography } from "@/components/ui/typography";

interface QueueEditCardProps {
  id: string;
  businessName: string;
  websiteUrl: string;
  onSave: (id: string, data: { businessName: string; websiteUrl: string }) => Promise<void>;
  onClose: () => void;
}

export function QueueEditCard({ id, businessName, websiteUrl, onSave, onClose }: QueueEditCardProps) {
  const [name, setName] = useState(businessName);
  const [url, setUrl] = useState(websiteUrl);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(id, { businessName: name, websiteUrl: url });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-xl">
        <Typography.H3 className="mb-4">Edit prospect</Typography.H3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-businessName" className="block">
              <Typography.Small className="mb-1">Business name</Typography.Small>
            </Label>
            <Input
              id="edit-businessName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Ltd"
            />
          </div>
          <div>
            <Label htmlFor="edit-websiteUrl" className="block">
              <Typography.Small className="mb-1">Website URL</Typography.Small>
            </Label>
            <Input
              id="edit-websiteUrl"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
