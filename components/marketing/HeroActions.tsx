"use client";

import Link from "next/link";
import { useMarketing } from "./MarketingProvider";

export function HeroActions() {
  const { openScanner } = useMarketing();

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <a
        href="#cta-enroll"
        className="bg-primary text-white px-6 py-3 rounded-lg whitespace-nowrap hover:bg-primary/90 font-semibold text-center no-underline"
      >
        Start Learning Now
      </a>
      <button
        type="button"
        onClick={openScanner}
        className="bg-white text-primary border border-primary px-6 py-3 rounded-lg whitespace-nowrap hover:bg-gray-50 font-semibold text-center"
      >
        View Market Scanner
      </button>
      <Link
        href="/courses"
        className="bg-white text-primary border border-primary px-6 py-3 rounded-lg whitespace-nowrap hover:bg-gray-50 font-semibold text-center no-underline hidden md:inline-flex items-center justify-center"
      >
        Explore Courses
      </Link>
    </div>
  );
}
