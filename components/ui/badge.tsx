import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  {
    variants: {
      variant: {
        default:
          "bg-surface-variant/30 border-surface-variant text-primary-foreground rounded-sm shadow-neon-primary [a]:hover:bg-primary-kinetic/80",
        secondary: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        destructive:
          "bg-destructive/10 text-destructive border border-destructive/20 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/30",
        outline:
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-secondary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
