"use client";

import Link from "next/link";
import { useLeadModal } from "./LeadModal";

type Active = "home" | "about" | "courses" | "contact";

const NAV_LINKS: { key: Active; label: string; href: string }[] = [
  { key: "home", label: "Home", href: "/" },
  { key: "about", label: "About us", href: "/about" },
  { key: "courses", label: "Courses", href: "/courses" },
  { key: "contact", label: "Contact", href: "/contact" },
];

export function MarketingHeader({ active = "home" }: { active?: Active }) {
  const { openLeadModal } = useLeadModal();

  return (
    <header className="mkt-header">
      <div className="mkt-container">
        <div className="mkt-header-inner">
          <Link href="/" className="mkt-header-logo">
            <img src="/Icon.png" alt="" className="mkt-logo-img" />
            <span className="mkt-brand">The Investing League</span>
          </Link>

          <nav className="mkt-nav-desktop" aria-label="Main">
            <ul className="mkt-nav-list">
              {NAV_LINKS.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className={`mkt-nav-link${item.key === active ? " is-active" : ""}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/scanner" className="mkt-nav-link">Scanner</Link>
              </li>
            </ul>
          </nav>

          <div className="mkt-header-cta">
            <button
              type="button"
              className="mkt-btn mkt-btn-primary mkt-btn-sm"
              onClick={() => openLeadModal({ title: "WhatsApp enquiry" })}
            >
              WhatsApp enquiry
            </button>
          </div>
        </div>

        <nav className="mkt-nav-mobile" aria-label="Mobile">
          <ul className="mkt-nav-list mkt-nav-list--mobile">
            {NAV_LINKS.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={`mkt-nav-link${item.key === active ? " is-active" : ""}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/scanner" className="mkt-nav-link">Scanner</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
