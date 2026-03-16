"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

interface QueueUploadFormProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function QueueUploadForm({ onSuccess, onError }: QueueUploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.set("file", file);

    try {
      const res = await fetch("/api/prospect-queue/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onSuccess(`Added ${data.created ?? 0} prospects.`);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept=".csv" onChange={handleChange} className="hidden" disabled={loading} />
      <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={loading}>
        {loading ? "Uploading…" : "Upload CSV"}
      </Button>
      <Typography.Muted className="mt-1 text-xs">
        Columns: businessName, websiteUrl (address optional). Max 5MB, 10,000 rows.
      </Typography.Muted>
    </div>
  );
}
