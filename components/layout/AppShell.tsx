"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";

export function AppShell({
  children,
  isAdmin,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={open} isAdmin={isAdmin} />
      <div className="app-main">
        {children}
        <button
          type="button"
          className="mobile-nav-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          ☰
        </button>
      </div>
    </div>
  );
}
