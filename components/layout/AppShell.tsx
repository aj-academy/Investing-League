"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";

export function AppShell({
  children,
  isAdmin,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1100) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="app-shell">
      {open && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <Sidebar open={open} isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
      <div className="app-main">
        {children}
        <button
          type="button"
          className="mobile-nav-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          ☰
        </button>
      </div>
    </div>
  );
}
