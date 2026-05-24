"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import type { VariantProps } from "class-variance-authority";
import React, { createContext, useContext } from "react";
import { Loader2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

// 1. Context
interface ButtonContextValue extends VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const ButtonContext = createContext<ButtonContextValue | null>(null);

function useButtonContext() {
  const context = useContext(ButtonContext);
  if (!context) {
    throw new Error("Button compound components must be used within Button.Root");
  }
  return context;
}

// 2. Props
export interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof ButtonPrimitive>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

// 3. Components
const ButtonRoot = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {
    return (
      <ButtonContext.Provider value={{ variant, size, isLoading }}>
        <ButtonPrimitive
          ref={ref}
          data-slot="button"
          disabled={disabled || isLoading}
          className={cn(buttonVariants({ variant, size }), className)}
          nativeButton={props.render ? false : undefined}
          {...props}
        >
          {children}
        </ButtonPrimitive>
      </ButtonContext.Provider>
    );
  },
);
ButtonRoot.displayName = "ButtonRoot";

const ButtonIcon = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & { icon: React.ReactNode }>(
  ({ className, icon, ...props }, ref) => {
    const { isLoading } = useButtonContext();
    if (isLoading) return null; // We might want to render a spinner instead globally, or handle it via ButtonSpinner

    return (
      <span ref={ref} className={cn("inline-flex shrink-0 items-center justify-center", className)} {...props}>
        {icon}
      </span>
    );
  },
);
ButtonIcon.displayName = "ButtonIcon";

const ButtonLabel = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <span ref={ref} className={cn("truncate", className)} {...props}>
        {children}
      </span>
    );
  },
);
ButtonLabel.displayName = "ButtonLabel";

const ButtonSpinner = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => {
    const { isLoading } = useButtonContext();
    if (!isLoading) return null;

    return (
      <span
        ref={ref}
        className={cn("inline-flex shrink-0 items-center justify-center animate-spin", className)}
        {...props}
      >
        <Loader2 className="w-4 h-4" />
      </span>
    );
  },
);
ButtonSpinner.displayName = "ButtonSpinner";

// 4. Export Compound Component & Backward Compatibility
// By exporting Button as ButtonRoot, existing <Button>text</Button> still works without breaking codebase.
// We attach the subcomponents so people can opt into <Button.Icon> etc.
export const Button = Object.assign(ButtonRoot, {
  Root: ButtonRoot,
  Icon: ButtonIcon,
  Label: ButtonLabel,
  Spinner: ButtonSpinner,
});

export { buttonVariants };
