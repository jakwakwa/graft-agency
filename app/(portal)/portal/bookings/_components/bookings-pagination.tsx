import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { CalBookingSortOrder, CalBookingsPagination } from "@/lib/services/cal.service";
import { cn } from "@/lib/utils";
import type { BookingSortKey } from "./bookings-table";

interface BookingsPaginationProps {
  month: string;
  pageSize: number;
  pagination: CalBookingsPagination;
  sortKey: BookingSortKey;
  sortOrder: CalBookingSortOrder;
}

function getPageHref(page: number, props: BookingsPaginationProps): string {
  const params = new URLSearchParams({
    month: props.month,
    page: String(page),
    sort: props.sortKey,
    order: props.sortOrder,
  });

  return `/portal/bookings?${params.toString()}`;
}

export function BookingsPagination(props: BookingsPaginationProps) {
  const { pagination } = props;
  if (pagination.totalPages <= 1) {
    return null;
  }

  const currentPage = pagination.currentPage;
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(pagination.totalPages, start + 4);
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  return (
    <div className="flex flex-col gap-3 border-t border-outline-ghost/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">
        Showing {pagination.returnedItems} of {pagination.totalItems} bookings · {props.pageSize} per page
      </span>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className={cn(!pagination.hasPreviousPage && "pointer-events-none opacity-50")}
              href={pagination.hasPreviousPage ? getPageHref(currentPage - 1, props) : "#"}
            />
          </PaginationItem>
          {start > 1 && (
            <>
              <PaginationItem>
                <PaginationLink href={getPageHref(1, props)}>1</PaginationLink>
              </PaginationItem>
              {start > 2 && <PaginationEllipsis />}
            </>
          )}
          {pages.map((page) => (
            <PaginationItem key={page}>
              <PaginationLink href={getPageHref(page, props)} isActive={page === currentPage}>
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          {end < pagination.totalPages && (
            <>
              {end < pagination.totalPages - 1 && <PaginationEllipsis />}
              <PaginationItem>
                <PaginationLink href={getPageHref(pagination.totalPages, props)}>
                  {pagination.totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          <PaginationItem>
            <PaginationNext
              className={cn(!pagination.hasNextPage && "pointer-events-none opacity-50")}
              href={pagination.hasNextPage ? getPageHref(currentPage + 1, props) : "#"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
