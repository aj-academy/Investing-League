"use client";

import Link from "next/link";
import { useState } from "react";
import { NAV_LINKS, type NavKey } from "@/lib/marketing/siteData";
import { useLeadModal } from "./LeadModal";

export function MarketingHeader({ active = "home" }: { active?: NavKey }) {
  const { openLeadModal } = useLeadModal();
  const [menuOpen, setMenuOpen] = useState(false);

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
            </ul>
          </nav>

          <div className="mkt-header-cta">
            <button
              type="button"
              className="mkt-btn mkt-btn-gold mkt-btn-sm mkt-btn-desktop-only"
              onClick={() =>
                openLeadModal({ title: "Talk on WhatsApp" })
              }
            >
              Talk on WhatsApp
            </button>
            <Link href="/login" className="mkt-btn mkt-btn-outline mkt-btn-sm">
              Login
            </Link>
            <button
              type="button"
              className="mkt-menu-btn"
              aria-expanded={menuOpen}
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div
          className="mkt-nav-drawer-overlay"
          onClick={() => setMenuOpen(false)}
          role="presentation"
        />
      )}
      <nav
        className={`mkt-nav-drawer${menuOpen ? " is-open" : ""}`}
        aria-label="Mobile menu"
      >
        <ul className="mkt-nav-drawer-list">
          {NAV_LINKS.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className={`mkt-nav-drawer-link${item.key === active ? " is-active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/login"
              className="mkt-nav-drawer-link"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
          </li>
          <li>
            <button
              type="button"
              className="mkt-btn mkt-btn-gold mkt-btn-block"
              onClick={() => {
                setMenuOpen(false);
                openLeadModal({ title: "Talk on WhatsApp" });
              }}
            >
              Talk on WhatsApp
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}
