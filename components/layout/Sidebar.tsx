"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Scanner", short: "Scan" },
  { href: "/journal", label: "Journal", short: "Jrnl" },
  { href: "/analytics", label: "Analytics", short: "Stats" },
  { href: "/settings", label: "Settings", short: "Set" },
];

function NavLabel({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  return (
    <span className="nav-label-full" style={{ opacity: pending ? 0.55 : 1 }}>
      {pending ? "..." : label}
    </span>
  );
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
      ? { href: "/login?admin=1", label: "Admin", short: "Adm" }
      : null;
  const items = adminLink ? [...links, adminLink] : links;

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
            prefetch
            className={pathname.startsWith(l.href) ? "active" : ""}
            onClick={onNavigate}
            title={l.label}
          >
            <NavLabel label={l.label} />
            <span className="nav-label-short">{l.short}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
