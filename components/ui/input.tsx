"use client";

import { Input as InputPrimitive } from "@base-ui/react/input";
import React, { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

const InputContext = createContext<{ isCompound: boolean } | null>(null);

const InputRoot = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <InputContext.Provider value={{ isCompound: true }}>
        <div
          ref={ref}
          className={cn(
            "flex h-11.5 w-full min-w-0 items-center rounded-2xl overflow-hidden border border-input bg-transparent px-2.5 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 dark:bg-input-background dark:focus-within:border-secondary",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </InputContext.Provider>
    );
  },
);
InputRoot.displayName = "InputRoot";

const InputIcon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-shrink-0   rounded-2xl overflow-hidden items-center justify-center text-muted-foreground mr-2",
          className,
        )}
        {...props}
      />
    );
  },
);
InputIcon.displayName = "InputIcon";

const InputField = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const context = useContext(InputContext);
    const isCompound = context?.isCompound === true;

    return (
      <InputPrimitive
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          isCompound
            ? "flex-1 bg-transparent px-0 py-1 text-base outline-none md:text-sm placeholder:text-muted-foreground file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50"
            : "h-11.5 w-full min-w-0 border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input-background dark:disabled:bg-muted dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40  rounded-2xl overflow-hidden",
          className,
        )}
        {...props}
      />
    );
  },
);
InputField.displayName = "InputField";

export const Input = Object.assign(InputField, {
  Root: InputRoot,
  Icon: InputIcon,
  Field: InputField,
});
