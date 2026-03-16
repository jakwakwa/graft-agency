"use client";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

interface LeadItem {
  id: string;
  customerName: string | null;
  status: string;
  scrapedData: { draftSubject?: string; draftBody?: string } | null;
}

interface LeadsTableProps {
  leads: LeadItem[];
  onApprove: (id: string) => void;
  onEdit: (id: string) => void;
}

export function LeadsTable({ leads, onApprove, onEdit }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <Typography.P className="text-muted-foreground">
          No draft leads. Add prospects to the queue and run the cron to generate drafts.
        </Typography.P>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Typography.Table>
        <Typography.TableHeader>
          <tr>
            <Typography.TableHead>Name</Typography.TableHead>
            <Typography.TableHead>Subject</Typography.TableHead>
            <Typography.TableHead>Preview</Typography.TableHead>
            <Typography.TableHead className="text-right">Actions</Typography.TableHead>
          </tr>
        </Typography.TableHeader>
        <Typography.TableBody>
          {leads.map((lead) => {
            const draft = lead.scrapedData as { draftSubject?: string; draftBody?: string } | null;
            const subject = draft?.draftSubject ?? "—";
            const preview =
              (draft?.draftBody ?? "").slice(0, 80) + (draft?.draftBody && draft.draftBody.length > 80 ? "…" : "");
            return (
              <Typography.TableRow key={lead.id}>
                <Typography.TableCell>{lead.customerName ?? "—"}</Typography.TableCell>
                <Typography.TableCell>{subject}</Typography.TableCell>
                <Typography.TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {preview || "—"}
                </Typography.TableCell>
                <Typography.TableCell className="text-right">
                  <Button variant="ghost" size="xs" onClick={() => onEdit(lead.id)}>
                    Edit
                  </Button>
                  <Button variant="default" size="xs" onClick={() => onApprove(lead.id)}>
                    Approve
                  </Button>
                </Typography.TableCell>
              </Typography.TableRow>
            );
          })}
        </Typography.TableBody>
      </Typography.Table>
    </div>
  );
}
