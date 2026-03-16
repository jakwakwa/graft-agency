"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Typography } from "@/components/ui/typography";
import type { QueueStatus } from "@/generated/prisma/client";
import { AddOneForm } from "./_components/add-one-form";
import { QueueTable } from "./_components/queue-table";
import { QueueUploadForm } from "./_components/queue-upload-form";

interface QueueItem {
  id: string;
  businessName: string;
  websiteUrl: string;
  status: QueueStatus;
  createdAt: string;
}

export default function QueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchQueue() {
    setLoading(true);
    try {
      const res = await fetch("/api/prospect-queue");
      if (res.status === 401) {
        setMessage({ type: "error", text: "Please sign in to view the queue." });
        setItems([]);
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setMessage({ type: "error", text: "Failed to load queue." });
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetch on mount only
  useEffect(() => {
    fetchQueue();
  }, []);

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/prospect-queue/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setMessage({ type: "success", text: "Prospect removed." });
      fetchQueue();
    } catch {
      setMessage({ type: "error", text: "Failed to delete." });
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <Typography.P className="text-muted-foreground">Loading…</Typography.P>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/automation" className="text-muted-foreground hover:text-foreground">
            ← Automation
          </Link>
          <Typography.H1 className="mt-2">Prospect Queue</Typography.H1>
          <Typography.Lead className="mt-1">
            Add prospects via CSV or single row. View and manage items before processing.
          </Typography.Lead>
        </div>
      </div>

      {message && (
        <div
          className={`mt-4 rounded-lg p-4 ${
            message.type === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}
        >
          <Typography.Small>{message.text}</Typography.Small>
        </div>
      )}

      <div className="mt-8 space-y-6">
        <div>
          <Typography.H3>Add single prospect</Typography.H3>
          <AddOneForm
            onSuccess={() => {
              setMessage({ type: "success", text: "Prospect added." });
              fetchQueue();
            }}
            onError={(text) => setMessage({ type: "error", text })}
          />
        </div>

        <div>
          <Typography.H3>Upload CSV</Typography.H3>
          <QueueUploadForm
            onSuccess={(text) => {
              setMessage({ type: "success", text });
              fetchQueue();
            }}
            onError={(text) => setMessage({ type: "error", text })}
          />
        </div>

        <div>
          <Typography.H3>Queue items</Typography.H3>
          <QueueTable items={items} onEdit={() => {}} onDelete={handleDelete} onRefresh={fetchQueue} />
        </div>
      </div>
    </div>
  );
}
