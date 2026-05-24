import React from "react";
import { cn } from "../../lib/utils";

export const CustomIcon = ({
  path,
  className,
  fill = "currentColor",
  fillOpacity,
  viewBox = "0 0 32 32",
}: {
  path: string;
  className?: string;
  fill?: string;
  fillOpacity?: string;
  viewBox?: string;
}) => (
  <svg className={cn("fill-none preserveAspectRatio-none", className)} preserveAspectRatio="none" viewBox={viewBox}>
    <path d={path} fill={fill} fillOpacity={fillOpacity} />
  </svg>
);
