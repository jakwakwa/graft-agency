import type { ReactNode } from "react";

interface DomainLayoutProps {
  children: ReactNode;
}

export default function DomainLayout({ children }: DomainLayoutProps) {
  return <>{children}</>;
}
