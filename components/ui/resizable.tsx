"use client";

import * as React from "react";
import { GripVerticalIcon } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { cn } from "./utils";

type GroupProps = React.ComponentProps<typeof Group>;

function ResizablePanelGroup({
  className,
  direction,
  orientation: orientationProp,
  ...props
}: GroupProps & {
  /** @deprecated Use `orientation` from the underlying Group API */
  direction?: "horizontal" | "vertical";
}) {
  const orientation = orientationProp ?? direction ?? "horizontal";

  return (
    <Group
      data-slot="resizable-panel-group"
      className={cn("group flex h-full w-full", orientation === "vertical" && "flex-col", className)}
      orientation={orientation}
      {...props}
    />
  );
}

function ResizablePanel({ ...props }: React.ComponentProps<typeof Panel>) {
  return <Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean;
}) {
  return (
    <Separator
      data-slot="resizable-handle"
      className={cn(
        "bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden group-data-[orientation=vertical]/group:h-px group-data-[orientation=vertical]/group:w-full group-data-[orientation=vertical]/group:after:left-0 group-data-[orientation=vertical]/group:after:h-1 group-data-[orientation=vertical]/group:after:w-full group-data-[orientation=vertical]/group:after:-translate-y-1/2 group-data-[orientation=vertical]/group:after:translate-x-0 [&[data-orientation=vertical]>div]:rotate-90",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </Separator>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
