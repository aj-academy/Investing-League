"use client";

import { useEffect, useState } from "react";
import { PlatformRiskGate } from "@/components/risk/PlatformRiskGate";
import { Sidebar } from "./Sidebar";
import { SidebarProvider, useSidebar } from "./SidebarContext";

function AppShellInner({
  children,
  isAdmin,
  hasAdminRole,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
  hasAdminRole?: boolean;
}) {
  const { open, close } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 1100);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className={`app-shell${open ? " sidebar-open" : ""}`}>
      {open && isMobile && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={close}
        />
      )}
      <Sidebar
        open={open}
        isAdmin={isAdmin}
        hasAdminRole={hasAdminRole}
        onNavigate={() => {
          if (window.innerWidth <= 1100) close();
        }}
      />
      <div className="app-main site-main">
        <PlatformRiskGate>{children}</PlatformRiskGate>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  isAdmin,
  hasAdminRole,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
  hasAdminRole?: boolean;
}) {
  return (
    <SidebarProvider>
      <AppShellInner isAdmin={isAdmin} hasAdminRole={hasAdminRole}>
        {children}
      </AppShellInner>
    </SidebarProvider>
  );
}
