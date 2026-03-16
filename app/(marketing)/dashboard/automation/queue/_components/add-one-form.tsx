"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Typography } from "@/components/ui/typography";

interface AddOneFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function AddOneForm({ onSuccess, onError }: AddOneFormProps) {
  const [businessName, setBusinessName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/prospect-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, websiteUrl }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to add prospect");
      }
      setBusinessName("");
      setWebsiteUrl("");
      onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to add prospect");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-4">
      <div className="flex-1 min-w-[200px]">
        <Label htmlFor="businessName" className="block">
          <Typography.Small className="mb-1 block">Business name</Typography.Small>
        </Label>
        <Input
          id="businessName"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Acme Ltd"
          required
        />
      </div>
      <div className="flex-1 min-w-[200px]">
        <Label htmlFor="websiteUrl" className="block">
          <Typography.Small className="mb-1 block">Website URL</Typography.Small>
        </Label>
        <Input
          id="websiteUrl"
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://example.com"
          required
        />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Adding…" : "Add"}
        </Button>
      </div>
    </form>
  );
}
