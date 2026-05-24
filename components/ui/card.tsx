"use client";

import React, { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

const CardContext = createContext<{ size: "default" | "sm" } | null>(null);

function useCardContext() {
  const context = useContext(CardContext);
  return context || { size: "default" };
}

const CardRoot = React.forwardRef<HTMLDivElement, React.ComponentProps<"div"> & { size?: "default" | "sm" }>(
  ({ className, size = "default", ...props }, ref) => {
    return (
      <CardContext.Provider value={{ size }}>
        <div
          ref={ref}
          data-slot="card"
          data-size={size}
          className={cn(
            "group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 pl-10 pr-6 text-sm text-card-foreground shadow-ambient glass-card has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:pl-8 data-[size=sm]:pr-5 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
            className,
          )}
          {...props}
        />
      </CardContext.Provider>
    );
  },
);
CardRoot.displayName = "CardRoot";

const CardHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => {
  const { size } = useCardContext();
  return (
    <div
      ref={ref}
      data-slot="card-header"
      data-size={size}
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-4 data-[size=sm]:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 data-[size=sm]:[.border-b]:pb-3",
        className,
      )}
      {...props}
    />
  );
});
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => {
  const { size } = useCardContext();
  return (
    <div
      ref={ref}
      data-slot="card-title"
      data-size={size}
      className={cn("text-base leading-snug font-medium data-[size=sm]:text-sm", className)}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="card-description"
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
      />
    );
  },
);
CardDescription.displayName = "CardDescription";

const CardAction = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
});
CardAction.displayName = "CardAction";

const CardContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => {
  const { size } = useCardContext();
  return (
    <div
      ref={ref}
      data-slot="card-content"
      data-size={size}
      className={cn("px-4 data-[size=sm]:px-3", className)}
      {...props}
    />
  );
});
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => {
  const { size } = useCardContext();
  return (
    <div
      ref={ref}
      data-slot="card-footer"
      data-size={size}
      className={cn("flex items-center rounded-b-xl bg-muted/40 p-4 data-[size=sm]:p-3", className)}
      {...props}
    />
  );
});
CardFooter.displayName = "CardFooter";

const Card = Object.assign(CardRoot, {
  Root: CardRoot,
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Action: CardAction,
  Content: CardContent,
  Footer: CardFooter,
});

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
