"use client";

import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";

const TOOL_LABELS: Record<string, { pending: string; complete: string }> = {
  captureLeadDetails: {
    pending: "Saving your details\u2026",
    complete: "Details saved",
  },
  checkAvailability: {
    pending: "Checking availability\u2026",
    complete: "Availability loaded",
  },
  bookAppointment: {
    pending: "Booking appointment\u2026",
    complete: "Appointment booked",
  },
  searchKnowledgeBase: {
    pending: "Searching knowledge base\u2026",
    complete: "Search complete",
  },
  handoffToHuman: {
    pending: "Connecting to a team member\u2026",
    complete: "Handed off to team",
  },
};

interface ToolStatusProps {
  toolName: string;
  state: string;
}

export function ToolStatus({ toolName, state }: ToolStatusProps) {
  const labels = TOOL_LABELS[toolName] ?? {
    pending: "Working\u2026",
    complete: "Done",
  };

  const isComplete = state === "result";
  const isError = state === "error";

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
      {isError ? (
        <>
          <XIcon className="size-3 text-destructive" />
          <span>Something went wrong</span>
        </>
      ) : isComplete ? (
        <>
          <CheckIcon className="size-3 text-green-600" />
          <span>{labels.complete}</span>
        </>
      ) : (
        <>
          <Loader2Icon className="size-3 animate-spin" />
          <span>{labels.pending}</span>
        </>
      )}
    </div>
  );
}
