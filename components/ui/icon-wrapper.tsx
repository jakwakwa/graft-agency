import React from "react";
import { cn } from "../../lib/utils";

interface IconWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: "pink" | "purple" | "rose" | "green";
  children: React.ReactNode;
}

export const IconWrapper = React.forwardRef<HTMLDivElement, IconWrapperProps>(
  ({ className, color = "rose", children, ...props }, ref) => {
    const bgColors = {
      rose: "bg-[#ffb0ac]/10",
      purple: "bg-[#c9bfff]/10",
      pink: "bg-[#fface8]/10",
      green: "bg-[#7bf7c8]/10",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center",
          bgColors[color],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
IconWrapper.displayName = "IconWrapper";