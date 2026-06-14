import type { ReactNode } from "react";
import type { NavKey } from "@/lib/marketing/siteData";
import { LeadModalProvider } from "./LeadModal";
import { MarketingFooter } from "./MarketingFooter";
import { MarketingHeader } from "./MarketingHeader";

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
      <div className="marketing-site">
        <MarketingHeader active={active} />
        <main className="w-full">{children}</main>
        {showFooter && <MarketingFooter />}
      </div>
    </LeadModalProvider>
  );
}
