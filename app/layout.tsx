import type { Metadata } from "next";
import { Toaster } from "sonner";
import SiteFooter from "@/components/layout/SiteFooter";
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
        {children}
        <Toaster theme="dark" position="top-right" richColors />
        <SiteFooter />
      </body>
    </html>
  );
}
