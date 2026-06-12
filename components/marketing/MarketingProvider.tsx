"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type MarketingContextValue = {
  scannerOpen: boolean;
  openScanner: () => void;
};

const MarketingContext = createContext<MarketingContextValue | null>(null);

export function MarketingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [scannerOpen, setScannerOpen] = useState(false);

  const openScanner = useCallback(() => {
    if (pathname !== "/") {
      window.location.assign("/#scanner");
      return;
    }
    setScannerOpen(true);
    window.history.replaceState(null, "", "#scanner");
    requestAnimationFrame(() => {
      document.getElementById("scanner")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [pathname]);

  useEffect(() => {
    if (window.location.hash === "#scanner") {
      setScannerOpen(true);
    }
  }, []);

  const value = useMemo(
    () => ({ scannerOpen, openScanner }),
    [scannerOpen, openScanner]
  );

  return <MarketingContext.Provider value={value}>{children}</MarketingContext.Provider>;
}

export function useMarketing() {
  const ctx = useContext(MarketingContext);
  if (!ctx) throw new Error("useMarketing must be used within MarketingProvider");
  return ctx;
}
