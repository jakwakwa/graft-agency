"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import type { QueueStatus } from "@/generated/prisma/client";
import { AddOneForm } from "./_components/add-one-form";
import { QueueEditCard } from "./_components/queue-edit-card";
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
  const [editingItem, setEditingItem] = useState<QueueItem | null>(null);

  async function fetchQueue() {
    setLoading(true);
    try {
      const res = await fetch("/api/prospect-queue");
      if (res.status === 401) {
        setMessage({ type: "error", text: "Please sign in to view the queue." });
        setItems([]);
        return;
      }
      if (res.status === 403) {
        setMessage({ type: "error", text: "Access denied. This area is for platform owners only." });
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

  async function handleEditSave(id: string, data: { businessName: string; websiteUrl: string }) {
    try {
      const res = await fetch(`/api/prospect-queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage({ type: "success", text: "Prospect updated." });
      setEditingItem(null);
      fetchQueue();
    } catch {
      setMessage({ type: "error", text: "Failed to update prospect." });
    }
  }

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

  const [processing, setProcessing] = useState(false);
  async function handleProcessQueue() {
    setProcessing(true);
    try {
      const res = await fetch("/api/automation/process-queue", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Process failed");
      setMessage({
        type: "success",
        text: data.message ?? `Processed ${data.processedCount ?? 0} prospects.`,
      });
      fetchQueue();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to process queue.",
      });
    } finally {
      setProcessing(false);
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
        <Button
          variant="default"
          size="sm"
          onClick={handleProcessQueue}
          disabled={processing || items.length === 0}
        >
          {processing ? "Processing…" : "Process queue now"}
        </Button>
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
          <QueueTable
            items={items}
            onEdit={(id) => setEditingItem(items.find((i) => i.id === id) ?? null)}
            onDelete={handleDelete}
            onRefresh={fetchQueue}
          />
        </div>
      </div>

      {editingItem && (
        <QueueEditCard
          id={editingItem.id}
          businessName={editingItem.businessName}
          websiteUrl={editingItem.websiteUrl}
          onSave={handleEditSave}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}
