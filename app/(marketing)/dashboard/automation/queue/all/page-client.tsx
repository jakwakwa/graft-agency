"use client";

import { ChevronLeft, ChevronRight, Trash2, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui-v2/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { formatStageLabel, getStageCategory } from "@/lib/utils/engagement-stages";
import { cn } from "@/components/ui/utils";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Lead {
  id: string;
  customerName: string | null;
  status: string;
  createdAt: string;
  engagementStage: string;
  scrapedData: {
    websiteUrl?: string;
  } | null;
}

interface PaginatedLeads {
  data: Lead[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function AllProspectsPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const parsedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
  const sortBy = searchParams.get("sort") ?? "createdAt";
  const sortOrder = searchParams.get("order") ?? "desc";

  const [data, setData] = useState<PaginatedLeads | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads?page=${page}&limit=25&sort=${sortBy}&order=${sortOrder}`);
      if (!res.ok) throw new Error("Failed to fetch leads");
      const json = await res.json();
      setData(json);
    } catch (err) {
      toast.error("Failed to load prospects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, sortBy, sortOrder]);

  const toggleSort = (column: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sortBy === column) {
      params.set("order", sortOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sort", column);
      params.set("order", "asc");
    }
    params.set("page", "1"); // Reset to first page on sort
    router.push(`?${params.toString()}`);
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Delete failed");
      }
      toast.success("Prospect deleted");
      fetchLeads();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete prospect");
    }
  };

  const renderPagination = () => {
    if (!data || data.pages <= 1) return null;

    const items = [];
    const maxVisible = 5;
    let start = Math.max(1, data.page - 2);
    let end = Math.min(data.pages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      items.push(
        <PaginationItem key="1">
          <PaginationLink href={`?page=1`} isActive={data.page === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (start > 2) items.push(<PaginationEllipsis key="e1" />);
    }

    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink href={`?page=${i}`} isActive={data.page === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (end < data.pages) {
      if (end < data.pages - 1) items.push(<PaginationEllipsis key="e2" />);
      items.push(
        <PaginationItem key={data.pages}>
          <PaginationLink href={`?page=${data.pages}`} isActive={data.page === data.pages}>
            {data.pages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return (
      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={data.page > 1 ? `?page=${data.page - 1}` : "#"}
              className={cn(data.page <= 1 && "pointer-events-none opacity-50")}
            />
          </PaginationItem>
          {items}
          <PaginationItem>
            <PaginationNext
              href={data.page < data.pages ? `?page=${data.page + 1}` : "#"}
              className={cn(data.page >= data.pages && "pointer-events-none opacity-50")}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <MarketingShell>
      <div className="mx-auto max-w-7xl space-y-8 p-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Queue
          </Button>
          <Typography.H2 className="mt-0 mb-0">All Prospects</Typography.H2>
        </div>

        <div className="rounded-xl border border-outline-ghost bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[250px]">Company</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Status</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleSort("engagementStage")}
                >
                  <div className="flex items-center">
                    Engagement Stage
                    {getSortIcon("engagementStage")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleSort("createdAt")}
                >
                  <div className="flex items-center">
                    Created
                    {getSortIcon("createdAt")}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No prospects found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((lead) => {
                  const category = getStageCategory(lead.engagementStage);

                  return (
                    <TableRow key={lead.id} className="group">
                      <TableCell className="font-bold">
                        <Link
                          href={`/dashboard/automation/queue/${lead.id}`}
                          className="hover:text-chart-3 hover:underline"
                        >
                          {lead.customerName ?? "Unknown"}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {lead.scrapedData?.websiteUrl ? (
                          <a
                            href={lead.scrapedData.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            {lead.scrapedData.websiteUrl}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                            lead.status === "CLOSED"
                              ? "bg-muted text-muted-foreground"
                              : "bg-chart-3/10 text-chart-3"
                          )}
                        >
                          {lead.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-xs font-medium",
                            category === "in_progress" && "text-chart-4",
                            category === "complete" && "text-chart-3",
                            category === "failed" && "text-destructive",
                            category === "not_started" && "text-muted-foreground"
                          )}
                        >
                          {formatStageLabel(lead.engagementStage)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              href={`/dashboard/automation/queue/${lead.id}`}
                              aria-label={
                                lead.customerName
                                  ? `View details for ${lead.customerName}`
                                  : "View prospect details"
                              }
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this prospect?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This permanently removes the prospect and all draft outreach. This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(lead.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {renderPagination()}
      </div>
    </MarketingShell>
  );
}
