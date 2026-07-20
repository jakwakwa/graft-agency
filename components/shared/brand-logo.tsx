import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_ASPECT = 3948 / 643;

type BrandLogoProps = {
  className?: string;
  /** Display height in pixels. Width is derived from the wordmark aspect ratio. */
  height?: number;
};

export function BrandLogo({ className, height = 28 }: BrandLogoProps) {
  const width = Math.round(height * LOGO_ASPECT);

  return (
    <Image
      src="/gt-logo.png"
      alt="GRAFT.TODAY"
      width={width}
      height={height}
      className={cn("h-auto w-auto", className)}
      style={{ height, width }}
      priority
    />
  );
}
