import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "./utils";

const cardVariants = cva("text-card-foreground flex flex-col gap-6 rounded-xl border", {
  variants: {
    variant: {
      default: "text-card-foreground flex flex-col gap-6 rounded-xl border",
      bento: " glass-super-agent",
      inner: " glass-super-agent",
      dashboard: "text-card-foreground flex flex-col gap-6 rounded-xl border",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Card({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      className={cn("glass-super-agent text-card-foreground flex flex-col p-8 gap-6 rounded-xl border", className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <h4 data-slot="card-title" className={cn("leading-none", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <p data-slot="card-description" className={cn("text-muted-foreground", className)} {...props} />;
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-6 last:pb-6", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-footer" className={cn("flex items-center px-6 pb-6 [.border-t]:pt-6", className)} {...props} />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
