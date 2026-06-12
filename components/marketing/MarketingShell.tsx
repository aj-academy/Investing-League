import type { ReactNode } from "react";
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
    <div className="marketing-site bg-gray-50">
      <MarketingHeader active={active} />
      {children}
      {showFooter && <MarketingFooter />}
    </div>
  );
}
