import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Chat Widget",
  description: "GRAFT TODAY chat widget",
};

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-foreground m-0 p-0 overflow-hidden">{children}</body>
    </html>
  );
}
