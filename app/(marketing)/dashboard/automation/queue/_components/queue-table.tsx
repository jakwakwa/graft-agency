"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import type { QueueStatus } from "@/generated/prisma/client";

interface QueueItem {
  id: string;
  businessName: string;
  websiteUrl: string;
  status: QueueStatus;
  createdAt: string;
}

interface QueueTableProps {
  items: QueueItem[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

const statusVariant: Record<QueueStatus, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary",
  PROCESSING: "default",
  COMPLETED: "outline",
  FAILED: "destructive",
  CANCELED: "outline",
};

export function QueueTable({ items, onEdit, onDelete, onRefresh }: QueueTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <Typography.P className="text-muted-foreground">Queue is empty. No prospects to process.</Typography.P>
        <Button variant="outline" size="sm" className="mt-4" onClick={onRefresh}>
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Typography.Table>
        <Typography.TableHeader>
          <tr>
            <Typography.TableHead>Business</Typography.TableHead>
            <Typography.TableHead>Website</Typography.TableHead>
            <Typography.TableHead>Status</Typography.TableHead>
            <Typography.TableHead className="text-right">Actions</Typography.TableHead>
          </tr>
        </Typography.TableHeader>
        <Typography.TableBody>
          {items.map((item) => (
            <Typography.TableRow key={item.id}>
              <Typography.TableCell>{item.businessName}</Typography.TableCell>
              <Typography.TableCell>
                <a
                  href={item.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {item.websiteUrl}
                </a>
              </Typography.TableCell>
              <Typography.TableCell>
                <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
              </Typography.TableCell>
              <Typography.TableCell className="text-right">
                {item.status === "PENDING" && (
                  <>
                    <Button variant="ghost" size="xs" onClick={() => onEdit(item.id)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="xs" onClick={() => onDelete(item.id)}>
                      Delete
                    </Button>
                  </>
                )}
              </Typography.TableCell>
            </Typography.TableRow>
          ))}
        </Typography.TableBody>
      </Typography.Table>
    </div>
  );
}
