"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Scanner", short: "Scan" },
  { href: "/journal", label: "Journal", short: "Jrnl" },
  { href: "/analytics", label: "Analytics", short: "Stats" },
  { href: "/settings", label: "Settings", short: "Set" },
];

function hardNavHref(href: string) {
  return href === "/admin" || href === "/auth/admin-unlock";
}

export function Sidebar({
  open,
  isAdmin,
  hasAdminRole,
  onNavigate,
}: {
  open: boolean;
  isAdmin?: boolean;
  hasAdminRole?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const adminLink = isAdmin
    ? { href: "/admin", label: "Admin", short: "Adm" }
    : hasAdminRole
      ? { href: "/auth/admin-unlock", label: "Admin", short: "Adm" }
      : null;
  const items = adminLink ? [...links, adminLink] : links;

  const onNavClick = (event: React.MouseEvent, href: string) => {
    onNavigate?.();
    if (hardNavHref(href)) {
      event.preventDefault();
      window.location.assign(href);
    }
  };

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
        {items.map((l) => {
          const pathOnly = l.href.split("?")[0];
          return (
            <Link
              key={l.href}
              href={l.href}
              prefetch={!hardNavHref(l.href)}
              className={pathname.startsWith(pathOnly) ? "active" : ""}
              onClick={(event) => onNavClick(event, l.href)}
              title={l.label}
            >
              <span className="nav-label-full">{l.label}</span>
              <span className="nav-label-short">{l.short}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
