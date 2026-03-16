import * as React from "react";
import { cn } from "@/lib/utils";

const TypographyH1 = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h1
      ref={ref}
      className={cn("scroll-m-20 text-4xl leading-relaxed m-1  font-extrabold tracking-tight text-balance", className)}
      {...props}
    />
  ),
);
TypographyH1.displayName = "TypographyH1";

const TypographyH2 = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn(
        "scroll-m-20 border-b border-border pb-2 text-3xl leading-relaxed m-1  font-semibold tracking-tight first:mt-0",
        className,
      )}
      {...props}
    />
  ),
);
TypographyH2.displayName = "TypographyH2";

const TypographyH3 = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("scroll-m-20 text-lg leading-relaxed mt-6 mb-8  font-semibold tracking-tight", className)}
      {...props}
    />
  ),
);
TypographyH3.displayName = "TypographyH3";

const TypographyH4 = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h4
      ref={ref}
      className={cn("scroll-m-20 text-sm leading-relaxed m-1  font-semibold tracking-tight", className)}
      {...props}
    />
  ),
);
TypographyH4.displayName = "TypographyH4";

const TypographyP = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("leading-8 [&:not(:first-child)]:mt-6", className)} {...props} />
  ),
);
TypographyP.displayName = "TypographyP";

const TypographyBlockquote = React.forwardRef<HTMLQuoteElement, React.HTMLAttributes<HTMLQuoteElement>>(
  ({ className, ...props }, ref) => (
    <blockquote ref={ref} className={cn("mt-6 border-s-2 border-border italic", className)} {...props} />
  ),
);
TypographyBlockquote.displayName = "TypographyBlockquote";

const TypographyLead = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-xl text-muted-foreground", className)} {...props} />
  ),
);
TypographyLead.displayName = "TypographyLead";

const TypographyLarge = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-lg leading-normal m-1  font-semibold", className)} {...props} />
  ),
);
TypographyLarge.displayName = "TypographyLarge";

const TypographySmall = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <small ref={ref} className={cn("text-sm leading-none font-medium", className)} {...props} />
  ),
);
TypographySmall.displayName = "TypographySmall";

const TypographyMuted = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
TypographyMuted.displayName = "TypographyMuted";

const TypographyCode = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <code
      ref={ref}
      className={cn("rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold", className)}
      {...props}
    />
  ),
);
TypographyCode.displayName = "TypographyCode";

const TypographyList = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("my-6 ms-6 list-disc [&>li]:mt-2", className)} {...props} />
  ),
);
TypographyList.displayName = "TypographyList";

const TypographyTable = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="my-6 w-full overflow-y-auto">
      <table ref={ref} className={cn("w-full", className)} {...props} />
    </div>
  ),
);
TypographyTable.displayName = "TypographyTable";

const TypographyTableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />,
);
TypographyTableHeader.displayName = "TypographyTableHeader";

const TypographyTableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  ),
);
TypographyTableBody.displayName = "TypographyTableBody";

const TypographyTableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("m-0 border-t border-border p-0 even:bg-muted transition-colors", className)}
      {...props}
    />
  ),
);
TypographyTableRow.displayName = "TypographyTableRow";

const TypographyTableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "border border-border px-4 py-2 text-start font-bold [&[align=center]]:text-center [&[align=end]]:text-end",
        className,
      )}
      {...props}
    />
  ),
);
TypographyTableHead.displayName = "TypographyTableHead";

const TypographyTableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "border border-border px-4 py-8 text-start [&[align=center]]:text-center [&[align=end]]:text-end",
        className,
      )}
      {...props}
    />
  ),
);
TypographyTableCell.displayName = "TypographyTableCell";

const Typography = {
  H1: TypographyH1,
  H2: TypographyH2,
  H3: TypographyH3,
  H4: TypographyH4,
  P: TypographyP,
  Blockquote: TypographyBlockquote,
  Lead: TypographyLead,
  Large: TypographyLarge,
  Small: TypographySmall,
  Muted: TypographyMuted,
  Code: TypographyCode,
  List: TypographyList,
  Table: TypographyTable,
  TableHeader: TypographyTableHeader,
  TableBody: TypographyTableBody,
  TableRow: TypographyTableRow,
  TableHead: TypographyTableHead,
  TableCell: TypographyTableCell,
};

export {
  Typography,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyP,
  TypographyBlockquote,
  TypographyLead,
  TypographyLarge,
  TypographySmall,
  TypographyMuted,
  TypographyCode,
  TypographyList,
  TypographyTable,
  TypographyTableHeader,
  TypographyTableBody,
  TypographyTableRow,
  TypographyTableHead,
  TypographyTableCell,
};
