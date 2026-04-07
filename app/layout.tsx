import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { NavHeader } from "@/components/shared/nav-header";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
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
        inter.variable,
        plusJakarta.variable,
        spaceGrotesk.variable,
        "font-sans selection:bg-primary-container selection:text-white",
      )}
    >
      <body className="grid-overlay min-h-screen">
        <NextTopLoader
          color="#ff24e4"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #ff24e4,0 0 5px #ff24e4"
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
