"use client";

import Link from "next/link";
import { Typography } from "@/components/ui/typography";
import { EngagementStageBadge, LeadStatusBadge } from "../../_components/status-badges";

interface TriageLead {
  id: string;
  customerName: string | null;
  status: string;
  createdAt: string;
  engagementStage?: string;
  scrapedData: {
    websiteUrl?: string;
    draftSubject?: string;
  } | null;
}

export function TriageTable({ leads }: { leads: TriageLead[] }) {
  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-ghost/30 p-24 text-center glass-card">
        <Typography.P className="text-muted-foreground italic">
          No prospects yet. Run the pipeline from the Automation hub to generate results.
        </Typography.P>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-outline-ghost/10 overflow-hidden glass-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-outline-ghost/10 bg-muted/20">
            <th className="px-6 py-4 text-left font-data text-[10px] uppercase tracking-widest text-muted-foreground">
              Company
            </th>
            <th className="px-6 py-4 text-left font-data text-[10px] uppercase tracking-widest text-muted-foreground hidden sm:table-cell">
              Website
            </th>
            <th className="px-6 py-4 text-left font-data text-[10px] uppercase tracking-widest text-muted-foreground">
              Email subject
            </th>
            <th className="px-6 py-4 text-left font-data text-[10px] uppercase tracking-widest text-muted-foreground">
              Status
            </th>
            <th className="px-6 py-4 text-left font-data text-[10px] uppercase tracking-widest text-muted-foreground hidden sm:table-cell">
              Automation
            </th>
            <th className="px-6 py-4 text-left font-data text-[10px] uppercase tracking-widest text-muted-foreground hidden md:table-cell">
              Date
            </th>
          </tr>
        </thead>
        <tbody className="font-sans">
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className="border-b border-outline-ghost/5 last:border-0 hover:bg-primary/5 transition-colors group"
            >
              <td className="px-6 py-4">
                <Link
                  href={`/dashboard/automation/queue/${lead.id}`}
                  className="font-bold text-foreground hover:text-primary transition-colors"
                >
                  {lead.customerName ?? "Unknown"}
                </Link>
              </td>
              <td className="px-6 py-4 hidden sm:table-cell">
                {lead.scrapedData?.websiteUrl ? (
                  <a
                    href={lead.scrapedData.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-secondary transition-colors truncate max-w-[180px] block font-data text-xs"
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
                  <span className="text-muted-foreground/30">—</span>
                )}
              </td>
              <td className="px-6 py-4">
                <Link
                  href={`/dashboard/automation/queue/${lead.id}`}
                  className="text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1 text-xs"
                >
                  {lead.scrapedData?.draftSubject ?? "No subject"}
                </Link>
              </td>
              <td className="px-6 py-4">
                <LeadStatusBadge status={lead.status} />
              </td>
              <td className="px-6 py-4 hidden sm:table-cell">
                <EngagementStageBadge stage={lead.engagementStage ?? "NOT_STARTED"} />
              </td>
              <td className="px-6 py-4 hidden md:table-cell text-muted-foreground whitespace-nowrap font-data text-[10px]">
                {new Date(lead.createdAt)
                  .toLocaleDateString("en-ZA", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                  .toUpperCase()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
