import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { DISCLAIMER } from "@/lib/utils";

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
        <footer className="z" style={{ textAlign: "center", padding: "20px", fontSize: 10, color: "var(--m3)" }}>
          {DISCLAIMER}
        </footer>
      </body>
    </html>
  );
}
