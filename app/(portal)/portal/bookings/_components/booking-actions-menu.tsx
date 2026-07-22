"use client";
import { Calendar01Icon, Delete02Icon, LinkSquare01Icon, MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CalBooking } from "@/lib/services/cal";

interface BookingActionsMenuProps {
  booking: CalBooking;
  onCancel: (booking: CalBooking) => void;
}

function getCalBookingUrl(uid: string): string {
  return `https://cal.com/booking/${encodeURIComponent(uid)}`;
}

export function BookingActionsMenu({ booking, onCancel }: BookingActionsMenuProps) {
  const calUrl = getCalBookingUrl(booking.uid);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button aria-label={`Open actions for ${booking.title}`} size="icon-sm" variant="ghost">
            <HugeiconsIcon icon={MoreHorizontalIcon} />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          render={
            <a href={calUrl} rel="noreferrer" target="_blank">
              <HugeiconsIcon icon={LinkSquare01Icon} />
              Open in Cal.com
            </a>
          }
        />
        <DropdownMenuItem
          render={
            <a href={calUrl} rel="noreferrer" target="_blank">
              <HugeiconsIcon icon={Calendar01Icon} />
              Reschedule in Cal.com
            </a>
          }
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onCancel(booking)} variant="destructive">
          <HugeiconsIcon icon={Delete02Icon} />
          Cancel booking
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
