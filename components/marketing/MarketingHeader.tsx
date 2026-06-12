"use client";

import Link from "next/link";

type Active = "home" | "about" | "courses" | "contact";

function navClass(active: boolean) {
  return active
    ? "text-green-500 border-b-2 border-green-500 px-1 pt-1 font-medium"
    : "text-gray-700 hover:text-green-500 px-1 pt-1 font-medium";
}

export function MarketingHeader({ active = "home" }: { active?: Active }) {
  return (
    <header className="bg-white shadow-md overflow-x-hidden">
      <nav className="flex items-center justify-between px-4 sm:px-12 h-16 lg:gap-8 max-w-7xl mx-auto">
        <Link href="/" className="flex-shrink-0 flex items-center gap-2">
          <img src="/Icon.png" className="h-14" alt="The Investing League" />
          <span className="text-xl sm:text-2xl text-green-700 font-semibold hidden sm:inline">
            The Investing League
          </span>
        </Link>
        <ul className="hidden lg:flex items-center gap-6 text-sm font-semibold">
          <li className={navClass(active === "home")}>
            <Link href="/">Home</Link>
          </li>
          <li className={navClass(active === "about")}>
            <Link href="/about">About us</Link>
          </li>
          <li className={navClass(active === "courses")}>
            <Link href="/courses">Courses</Link>
          </li>
          <li>
            <Link href="/#scanner" className={navClass(false)}>Scanner</Link>
          </li>
          <li className={navClass(active === "contact")}>
            <Link href="/contact">Contact</Link>
          </li>
        </ul>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-green-600 border border-green-500 px-3 py-2 rounded text-sm font-semibold hover:bg-green-50"
          >
            Decision Lab
          </Link>
          <Link
            href="/login"
            className="bg-green-500 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-green-600"
          >
            Log in
          </Link>
        </div>
      </nav>
    </header>
  );
}
