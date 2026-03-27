import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { Geist_Mono, Lora, Nunito_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { NavHeader } from "@/components/shared/nav-header";

const nunitoSans = Nunito_Sans({ variable: "--font-sans" });

const lora = Lora({ subsets: ["latin"], variable: "--font-serif" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kona Agency",
  description: "Multi-tenant AI agency platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(lora.variable, geistMono.variable, "font-sans", nunitoSans.variable)}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ClerkProvider>
            <NavHeader />

            {children}</ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
