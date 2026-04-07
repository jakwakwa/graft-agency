import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Chat Widget",
  description: "GRAFT TODAY chat widget",
};

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground m-0 overflow-hidden p-0">{children}</body>
    </html>
  );
}
