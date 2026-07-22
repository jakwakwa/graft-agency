"use client";
import { ArrowDown01Icon, ArrowUp01Icon, ArrowUpDownIcon, CalendarRemove01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";
import { useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import type { CalBooking, CalBookingSortOrder, CalBookingsPagination } from "@/lib/services/cal";
import { cancelBookingAction } from "../actions";
import { BookingActionsMenu } from "./booking-actions-menu";
import { BookingsPagination } from "./bookings-pagination";

export type BookingSortKey = "start" | "end" | "created" | "updated";

interface BookingsTableProps {
  bookings: CalBooking[];
  error?: string;
  month: string;
  pageSize: number;
  pagination?: CalBookingsPagination;
  sortKey: BookingSortKey;
  sortOrder: CalBookingSortOrder;
}

interface SortableHeadProps {
  children: ReactNode;
  month: string;
  sortKey: BookingSortKey;
  sortOrder: CalBookingSortOrder;
  value: BookingSortKey;
}

function getSortHref(
  month: string,
  value: BookingSortKey,
  sortKey: BookingSortKey,
  sortOrder: CalBookingSortOrder,
): string {
  const nextOrder = sortKey === value && sortOrder === "asc" ? "desc" : "asc";
  const params = new URLSearchParams({ month, page: "1", sort: value, order: nextOrder });
  return `/portal/bookings?${params.toString()}`;
}

function SortIcon({ active, order }: { active: boolean; order: CalBookingSortOrder }) {
  if (!active) return <HugeiconsIcon icon={ArrowUpDownIcon} />;
  return order === "asc" ? <HugeiconsIcon icon={ArrowUp01Icon} /> : <HugeiconsIcon icon={ArrowDown01Icon} />;
}

function SortableHead({ children, month, sortKey, sortOrder, value }: SortableHeadProps) {
  const active = sortKey === value;

  return (
    <TableHead>
      <Button
        className="-ml-2"
        render={
          <a href={getSortHref(month, value, sortKey, sortOrder)}>
            {children}
            <SortIcon active={active} order={sortOrder} />
          </a>
        }
        size="sm"
        variant="ghost"
      />
    </TableHead>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "cancelled":
    case "rejected":
      return "destructive";
    case "accepted":
      return "secondary";
    case "pending":
      return "outline";
    default:
      return "default";
  }
}

export function BookingsTable({
  bookings,
  error,
  month,
  pageSize,
  pagination,
  sortKey,
  sortOrder,
}: BookingsTableProps) {
  const [bookingToCancel, setBookingToCancel] = useState<CalBooking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  async function confirmCancel() {
    if (!bookingToCancel) return;

    setIsCancelling(true);
    const result = await cancelBookingAction({
      bookingUid: bookingToCancel.uid,
      cancellationReason: "Cancelled from GRAFT Portal",
    });
    setIsCancelling(false);

    if (!result.success) {
      toast.error(result.error ?? "Could not cancel booking");
      return;
    }

    toast.success("Booking cancelled");
    setBookingToCancel(null);
  }

  if (error) {
    return <Typography.P className="text-muted-foreground">{error}</Typography.P>;
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <HugeiconsIcon icon={CalendarRemove01Icon} className="text-muted-foreground" />
        <div className="flex flex-col gap-2">
          <Typography.H3 className="m-0">No bookings this month</Typography.H3>
          <Typography.P className="text-muted-foreground">
            Upcoming Cal.com bookings for the selected month will appear here.
          </Typography.P>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-6 -mb-6 overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <SortableHead month={month} sortKey={sortKey} sortOrder={sortOrder} value="start">
              Start
            </SortableHead>
            <TableHead>Attendee</TableHead>
            <TableHead>Booking</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => {
            const attendee = booking.attendees[0];

            return (
              <TableRow key={booking.uid}>
                <TableCell>{formatDateTime(booking.start)}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{attendee?.name ?? "Unknown attendee"}</span>
                    <span className="text-xs text-muted-foreground">{attendee?.email ?? "No email supplied"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{booking.title}</span>
                    <span className="text-xs text-muted-foreground">{booking.eventType?.slug ?? "No event type"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(booking.status)}>{booking.status}</Badge>
                </TableCell>
                <TableCell>
                  <span className="max-w-48 truncate text-muted-foreground">{booking.location ?? "No location"}</span>
                </TableCell>
                <TableCell className="text-right">
                  <BookingActionsMenu booking={booking} onCancel={setBookingToCancel} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {pagination && (
        <BookingsPagination
          month={month}
          pageSize={pageSize}
          pagination={pagination}
          sortKey={sortKey}
          sortOrder={sortOrder}
        />
      )}
      <AlertDialog open={bookingToCancel !== null} onOpenChange={(open) => !open && setBookingToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel {bookingToCancel?.title ?? "the selected booking"} in Cal.com. This action cannot be
              undone from the portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep booking</AlertDialogCancel>
            <AlertDialogAction disabled={isCancelling} onClick={confirmCancel}>
              {isCancelling ? "Cancelling..." : "Cancel booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
