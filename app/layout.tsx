import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Work_Sans, Be_Vietnam_Pro, Lexend } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { NavHeader } from "@/components/shared/nav-header";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-data",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GRAFT TODAY",
  description: "Multi-tenant AI agency platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        workSans.variable,
        beVietnamPro.variable,
        lexend.variable,
        "font-sans selection:bg-primary-container selection:text-white",
      )}
    >
      <body className="grid-overlay min-h-screen">
        <NextTopLoader
          color="#5737f0"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #5737f0,0 0 5px #5737f0"
        />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ClerkProvider>
            <NavHeader />

            {children}
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
