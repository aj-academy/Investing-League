import type { Metadata } from "next";
import SiteFooter from "@/components/layout/SiteFooter";
import { InspectGuardRoot } from "@/components/security/InspectGuardRoot";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Investing League Decision Lab",
  description:
    "Educational decision-support and trade journaling platform for market setup scanning, signal testing, and performance analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <InspectGuardRoot />
        {children}
        <Toaster theme="dark" position="top-right" richColors />
        <SiteFooter />
      </body>
    </html>
  );
}
