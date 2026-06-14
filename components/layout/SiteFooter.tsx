"use client";

import { usePathname } from "next/navigation";
import { DISCLAIMER } from "@/lib/utils";

const MARKETING_PREFIXES = [
  "/about",
  "/courses",
  "/contact",
  "/decision-lab",
  "/plans",
  "/privacy",
  "/scanner-info",
];

function isMarketingPath(pathname: string) {
  if (pathname === "/") return true;
  return MARKETING_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export default function SiteFooter() {
  const pathname = usePathname();
  if (isMarketingPath(pathname)) return null;

  return (
    <footer className="z site-footer" style={{ textAlign: "center", fontSize: 10, color: "var(--m3)" }}>
      {DISCLAIMER}
    </footer>
  );
}
