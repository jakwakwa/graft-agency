"use client";

import type * as React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface ListPaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function ListPagination({ page, pageCount, onPageChange, className }: ListPaginationProps) {
  if (pageCount <= 1) return null;

  const goTo = (next: number) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (next >= 1 && next <= pageCount && next !== page) onPageChange(next);
  };

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={page <= 1}
            className={cn(page <= 1 && "pointer-events-none opacity-50")}
            onClick={goTo(page - 1)}
          />
        </PaginationItem>
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
          <PaginationItem key={p}>
            <PaginationLink href="#" isActive={p === page} onClick={goTo(p)}>
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={page >= pageCount}
            className={cn(page >= pageCount && "pointer-events-none opacity-50")}
            onClick={goTo(page + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
