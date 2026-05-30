"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Scanner", short: "Scan" },
  { href: "/journal", label: "Journal", short: "Jrnl" },
  { href: "/analytics", label: "Analytics", short: "Stats" },
  { href: "/settings", label: "Settings", short: "Set" },
];

export function Sidebar({
  open,
  isAdmin,
  onNavigate,
}: {
  open: boolean;
  isAdmin?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = isAdmin
    ? [...links, { href: "/admin", label: "Admin", short: "Adm" }]
    : links;

  return (
    <aside className={`app-sidebar z ${open ? "open" : ""}`}>
      <div className="sidebar-brand">
        <div className="logo">
          <span style={{ fontFamily: "var(--mono)", color: "var(--blue)", fontSize: 18 }}>TIL</span>
        </div>
        <div className="sidebar-brand-text">
          <div className="bname" style={{ fontSize: 11, letterSpacing: 2 }}>
            INVESTING LEAGUE
          </div>
          <div className="bsub">Decision Lab</div>
        </div>
      </div>
      <nav className="app-nav">
        {items.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={pathname.startsWith(l.href) ? "active" : ""}
            onClick={onNavigate}
            title={l.label}
          >
            <span className="nav-label-full">{l.label}</span>
            <span className="nav-label-short">{l.short}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
