"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";

interface ScrapedData {
  websiteUrl?: string;
  draftSubject?: string;
  draftBody?: string;
  businessDescription?: string;
  hasChatbot?: boolean;
  hasVoiceAgent?: boolean;
  painPoints?: string[];
  targetOutreachAngle?: string;
  coreServices?: Array<{ name: string; description: string }>;
}

interface Lead {
  id: string;
  customerName: string | null;
  scrapedData: ScrapedData | null;
  createdAt: string;
}

export default function QueueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchLead() {
      try {
        const res = await fetch(`/api/leads/${id}`);
        if (!res.ok) {
          setMessage({ type: "error", text: "Prospect not found." });
          return;
        }
        const data: Lead = await res.json();
        setLead(data);
        setSubject(data.scrapedData?.draftSubject ?? "");
        setBody(data.scrapedData?.draftBody ?? "");
      } catch {
        setMessage({ type: "error", text: "Failed to load prospect." });
      } finally {
        setLoading(false);
      }
    }
    fetchLead();
  }, [id]);

  async function handleSave() {
    if (!lead) return;
    setSaving(true);
    try {
      const merged = { ...(lead.scrapedData ?? {}), draftSubject: subject, draftBody: body };
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scrapedData: merged }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage({ type: "success", text: "Draft saved." });
    } catch {
      setMessage({ type: "error", text: "Failed to save draft." });
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    if (!lead) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/leads/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Approve failed");
      setMessage({ type: "success", text: "Lead approved and email sent." });
      setTimeout(() => router.push("/dashboard/automation/queue"), 1500);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to approve.",
      });
    } finally {
      setApproving(false);
    }
  }

  async function handleDiscard() {
    if (!lead) return;
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      });
      if (!res.ok) throw new Error("Discard failed");
      router.push("/dashboard/automation/queue");
    } catch {
      setMessage({ type: "error", text: "Failed to discard." });
    }
  }

  if (loading) {
    return (
      <div className="container max-w-5xl py-8">
        <Typography.P className="text-muted-foreground">Loading…</Typography.P>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="container max-w-5xl py-8">
        <Link href="/dashboard/automation/queue" className="text-muted-foreground hover:text-foreground text-sm">
          ← Prospect Queue
        </Link>
        <Typography.P className="mt-4 text-muted-foreground">Prospect not found.</Typography.P>
      </div>
    );
  }

  const d = lead.scrapedData ?? {};

  return (
    <div className="container max-w-5xl py-8">
      <Link href="/dashboard/automation/queue" className="text-muted-foreground hover:text-foreground text-sm">
        ← Prospect Queue
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <Typography.H1>{lead.customerName ?? "Unknown Company"}</Typography.H1>
          {d.websiteUrl && (
            <a
              href={d.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-sm text-blue-600 hover:underline"
            >
              {d.websiteUrl}
            </a>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleDiscard}>
            Discard
          </Button>
          <Button variant="default" size="sm" onClick={handleApprove} disabled={approving}>
            {approving ? "Approving…" : "Approve & Send"}
          </Button>
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

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Audit panel */}
        <div className="rounded-lg border border-border p-5 space-y-4">
          <Typography.H4>Prospect Audit</Typography.H4>

          <div className="flex gap-2 flex-wrap">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                d.hasChatbot ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
              }`}
            >
              {d.hasChatbot ? "Has Chatbot" : "No Chatbot"}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                d.hasVoiceAgent ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
              }`}
            >
              {d.hasVoiceAgent ? "Has Voice Agent" : "No Voice Agent"}
            </span>
          </div>

          {d.businessDescription && (
            <div>
              <Typography.Small className="font-medium text-muted-foreground">About</Typography.Small>
              <Typography.P className="mt-1 text-sm">{d.businessDescription}</Typography.P>
            </div>
          )}

          {d.coreServices && d.coreServices.length > 0 && (
            <div>
              <Typography.Small className="font-medium text-muted-foreground">Services</Typography.Small>
              <ul className="mt-1 space-y-1">
                {d.coreServices.map((s, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground"> — {s.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {d.painPoints && d.painPoints.length > 0 && (
            <div>
              <Typography.Small className="font-medium text-muted-foreground">Pain Points</Typography.Small>
              <ul className="mt-1 list-disc pl-4 space-y-1">
                {d.painPoints.map((p, i) => (
                  <li key={i} className="text-sm">{p}</li>
                ))}
              </ul>
            </div>
          )}

          {d.targetOutreachAngle && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
              <Typography.Small className="font-medium text-blue-800">Outreach Angle</Typography.Small>
              <Typography.P className="mt-1 text-sm text-blue-900">{d.targetOutreachAngle}</Typography.P>
            </div>
          )}
        </div>

        {/* Email draft panel */}
        <div className="rounded-lg border border-border p-5 flex flex-col gap-4">
          <Typography.H4>Email Draft</Typography.H4>

          <div>
            <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1"
              placeholder="Email subject"
            />
          </div>

          <div className="flex flex-col flex-1">
            <Label htmlFor="body" className="text-sm font-medium">Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1 flex-1 min-h-[280px] resize-none"
              placeholder="Email body"
            />
          </div>

          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="self-start">
            {saving ? "Saving…" : "Save Draft"}
          </Button>
        </div>
      </div>
    </div>
  );
}
