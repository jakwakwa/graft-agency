import { Typography } from "@/components/ui/typography";
import React from "react";

export function PolicySection({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-10 scroll-mt-8">
      {Icon ? (
        <div className="flex items-center gap-3 mb-4 h-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-4 w-4 mt-6 text-foreground" aria-hidden />
          </div>
          <Typography.H3 className="block h-8 text-foreground">{title}</Typography.H3>
        </div>
      ) : (
        <Typography.H3 className="block mb-4 text-foreground">{title}</Typography.H3>
      )}
      <div className={`space-y-3 ${Icon ? "pl-11" : ""}`}>{children}</div>
    </section>
  );
}
