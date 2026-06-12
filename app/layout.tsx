import type { Metadata } from "next";
import SiteFooter from "@/components/layout/SiteFooter";
import { InspectGuardRoot } from "@/components/security/InspectGuardRoot";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "The Investing League",
    template: "%s | The Investing League",
  },
  description:
    "Financial education, courses, and the Decision Lab — educational market scanner, journal, and analytics.",
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
