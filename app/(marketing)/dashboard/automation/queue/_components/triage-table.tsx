"use client";

import Link from "next/link";
import { PushToAttioButton } from "@/components/push-to-attio-button";
import { Typography } from "@/components/ui/typography";

interface TriageLead {
  id: string;
  customerName: string | null;
  status: string;
  createdAt: string;
  attioRecordId: string | null;
  scrapedData: {
    websiteUrl?: string;
    draftSubject?: string;
  } | null;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT_PENDING: "bg-yellow-100 text-yellow-800",
  CONTACTED: "bg-blue-100 text-blue-800",
  REPLIED: "bg-purple-100 text-purple-800",
  BOOKED: "bg-green-100 text-green-800",
  CLOSED: "bg-muted text-muted-foreground",
  SCRAPED: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT_PENDING: "Draft",
  CONTACTED: "Contacted",
  REPLIED: "Replied",
  BOOKED: "Booked",
  CLOSED: "Closed",
  SCRAPED: "Scraped",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function TriageTable({ leads }: { leads: TriageLead[] }) {
  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <Typography.P className="text-muted-foreground">
          No prospects yet. Run the pipeline from the Automation hub to generate results.
        </Typography.P>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Company</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Website</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email subject</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Date</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">CRM</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/automation/queue/${lead.id}`}
                  className="font-medium hover:underline"
                >
                  {lead.customerName ?? "Unknown"}
                </Link>
              </td>
              <td className="px-4 py-3 hidden sm:table-cell">
                {lead.scrapedData?.websiteUrl ? (
                  <a
                    href={lead.scrapedData.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground hover:underline truncate max-w-[180px] block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(() => {
                      try {
                        return new URL(lead.scrapedData!.websiteUrl!).hostname;
                      } catch {
                        return lead.scrapedData!.websiteUrl;
                      }
                    })()}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/automation/queue/${lead.id}`}
                  className="text-muted-foreground hover:text-foreground line-clamp-1"
                >
                  {lead.scrapedData?.draftSubject ?? "No subject"}
                </Link>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={lead.status} />
              </td>
              <td className="px-4 py-3 hidden md:table-cell text-muted-foreground whitespace-nowrap">
                {new Date(lead.createdAt).toLocaleDateString("en-ZA", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-3 hidden sm:table-cell">
                <PushToAttioButton leadId={lead.id} initialSynced={!!lead.attioRecordId} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
