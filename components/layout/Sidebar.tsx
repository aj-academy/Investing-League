"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Scanner" },
  { href: "/journal", label: "Journal" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar({
  open,
  isAdmin,
}: {
  open: boolean;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const items = isAdmin ? [...links, { href: "/admin", label: "Admin" }] : links;

  return (
    <aside className={`app-sidebar z ${open ? "open" : ""}`}>
      <div className="brand" style={{ marginBottom: 20 }}>
        <div className="logo">
          <span style={{ fontFamily: "var(--mono)", color: "var(--blue)", fontSize: 18 }}>TIL</span>
        </div>
        <div>
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
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
