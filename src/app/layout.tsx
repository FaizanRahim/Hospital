
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/context/providers";
import { cn } from "@/lib/utils";
import { getPlatformLogo } from "@/lib/actions/settings-actions";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/toaster";

const fontSans = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Mindful Assessment Platform",
  description: "A platform for mental health assessments and resource recommendations.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const logoUrl = await getPlatformLogo();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader logoUrl={logoUrl} />
            <div className="flex-1">{children}</div>
          </div>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
