import type { ReactNode } from "react";
import type { NavKey } from "@/lib/marketing/siteData";
import { Cinzel, Inter } from "next/font/google";
import { LeadModalProvider } from "./LeadModal";
import { MarketingFooter } from "./MarketingFooter";
import { MarketingHeader } from "./MarketingHeader";
import { StickyWhatsApp } from "./StickyWhatsApp";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

export function MarketingShell({
  active,
  children,
  showFooter = true,
}: {
  active: NavKey;
  children: ReactNode;
  showFooter?: boolean;
}) {
  return (
    <LeadModalProvider>
      <div className={`marketing-site ${inter.variable} ${cinzel.variable}`}>
        <MarketingHeader active={active} />
        <main className="w-full">{children}</main>
        {showFooter && <MarketingFooter />}
        <StickyWhatsApp />
      </div>
    </LeadModalProvider>
  );
}
