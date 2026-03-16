import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

import { Geist_Mono, Lora, Nunito_Sans } from "next/font/google";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <html lang="en" className={cn(lora.variable, geistMono.variable, "font-sans", nunitoSans.variable)}>
      <body>
        <ClerkProvider>
          <header className="flex justify-end items-center p-4 gap-4 h-16">
            <Show when="signed-out">
              <SignInButton>
                <Button size="default" variant="ghost">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button size="default" variant="default">
                  Sign Up
                </Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
