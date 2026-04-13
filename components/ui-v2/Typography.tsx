import React from "react";
import { cn } from "../../lib/utils";

type TypographyProps<T extends React.ElementType> = {
  as?: T;
  className?: string;
  children: React.ReactNode;
} & React.ComponentPropsWithoutRef<T>;

export const H1 = ({ className, as: Component = "h1", ...props }: TypographyProps<"h1">) => (
  <Component
    className={cn(
      "text-5xl sm:text-6xl lg:text-[80px] leading-[1.1] font-['Ovo',serif] tracking-tight text-white",
      className
    )}
    {...props}
  />
);

export const H2 = ({ className, as: Component = "h2", ...props }: TypographyProps<"h2">) => (
  <Component
    className={cn(
      "text-4xl sm:text-5xl font-['Ovo',serif] text-white leading-tight",
      className
    )}
    {...props}
  />
);

export const H3 = ({ className, as: Component = "h3", ...props }: TypographyProps<"h3">) => (
  <Component
    className={cn("text-xl font-['Ovo',serif] text-white", className)}
    {...props}
  />
);

export const H4 = ({ className, as: Component = "h4", ...props }: TypographyProps<"h4">) => (
  <Component
    className={cn("text-white text-xl font-bold", className)}
    {...props}
  />
);

export const BodyText = ({ className, as: Component = "p", variant = "default", ...props }: TypographyProps<"p"> & { variant?: "default" | "muted" | "large" }) => {
  const variants = {
    default: "text-[#a5a9c4] leading-relaxed",
    muted: "text-[#8b8eab] leading-relaxed",
    large: "text-[#ddbed4] text-lg sm:text-xl max-w-xl leading-relaxed",
  };
  return (
    <Component
      className={cn(variants[variant], className)}
      {...props}
    />
  );
};

export const EyebrowText = ({ className, as: Component = "p", color = "primary", ...props }: TypographyProps<"p"> & { color?: "primary" | "secondary" | "accent" | "success" | "warning" }) => {
  const colors = {
    primary: "text-[#c9bfff]",
    secondary: "text-[#a5a9c4]",
    accent: "text-[#fface8]",
    success: "text-[#7bf7c8]",
    warning: "text-[#ffc07e]",
  };
  return (
    <Component
      className={cn(
        "text-[10px] tracking-wider font-bold uppercase",
        colors[color],
        className
      )}
      {...props}
    />
  );
};

export const TextGradient = ({
  className,
  as: Component = "span",
  gradient = "primary",
  ...props
}: TypographyProps<"span"> & { gradient?: "primary" | "secondary" | "accent" }) => {
  const gradients = {
    primary: "bg-gradient-to-r from-[#1149f0] via-[#ffc5ac] to-[#e35efe]",
    secondary: "bg-gradient-to-r from-[#9888ff] via-[#ffc5ac] to-[#e35efe]",
    accent: "bg-gradient-to-r from-[#fface8] to-[#c9bfff]",
  };

  return (
    <Component
      className={cn(
        "bg-clip-text text-transparent",
        gradients[gradient],
        className
      )}
      {...props}
    />
  );
};