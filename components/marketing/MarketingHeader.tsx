"use client";

import Link from "next/link";
import { useLeadModal } from "./LeadModal";

type Active = "home" | "about" | "courses" | "contact";

function navClass(active: boolean) {
  return active
    ? "text-green-500 border-b-2 border-green-500 font-semibold"
    : "text-gray-800 hover:text-green-500 font-semibold";
}

const NAV_LINKS: { key: Active; label: string; href: string }[] = [
  { key: "home", label: "Home", href: "/" },
  { key: "about", label: "About us", href: "/about" },
  { key: "courses", label: "Courses", href: "/courses" },
  { key: "contact", label: "Contact", href: "/contact" },
];

export function MarketingHeader({ active = "home" }: { active?: Active }) {
  const { openLeadModal } = useLeadModal();

  return (
    <header className="bg-white shadow-md w-full">
      <div className="mkt-container">
        <div className="mkt-header-row">
          <Link href="/" className="mkt-header-logo flex items-center gap-2 min-w-0 no-underline">
            <img src="/Icon.png" className="h-12 w-12 sm:h-14 sm:w-14 shrink-0" alt="The Investing League" />
            <span className="mkt-brand text-lg sm:text-2xl lg:text-3xl text-green-700 font-bold hidden sm:inline leading-tight">
              The Investing League
            </span>
          </Link>

          <ul className="mkt-header-links hidden lg:flex items-center gap-6 xl:gap-8 text-base">
            {NAV_LINKS.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className={`${navClass(item.key === active)} py-1 inline-block no-underline`}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/scanner" className={`${navClass(false)} py-1 inline-block no-underline`}>
                Scanner
              </Link>
            </li>
          </ul>

          <div className="mkt-header-actions">
            <button
              type="button"
              onClick={() => openLeadModal({ title: "WhatsApp enquiry" })}
              className="mkt-wa-btn bg-green-500 text-white px-3 sm:px-4 py-2 rounded text-sm font-semibold hover:bg-green-600 whitespace-nowrap"
            >
              WhatsApp enquiry
            </button>
          </div>
        </div>

        <ul className="lg:hidden flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pb-3 text-sm border-t border-gray-100 pt-3">
          {NAV_LINKS.map((item) => (
            <li key={item.key}>
              <Link href={item.href} className={`${navClass(item.key === active)} py-0.5 inline-block no-underline`}>
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/scanner" className={`${navClass(false)} py-0.5 inline-block no-underline`}>
              Scanner
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
