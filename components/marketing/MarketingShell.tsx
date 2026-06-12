import type { ReactNode } from "react";
import { LeadModalProvider } from "./LeadModal";
import { MarketingFooter } from "./MarketingFooter";
import { MarketingHeader } from "./MarketingHeader";

type Active = "home" | "about" | "courses" | "contact";

export function MarketingShell({
  active,
  children,
  showFooter = true,
}: {
  active: Active;
  children: ReactNode;
  showFooter?: boolean;
}) {
  return (
    <LeadModalProvider>
      <div className="marketing-site w-full min-w-0 bg-gray-50">
        <MarketingHeader active={active} />
        <main className="w-full">{children}</main>
        {showFooter && <MarketingFooter />}
      </div>
    </LeadModalProvider>
  );
}
