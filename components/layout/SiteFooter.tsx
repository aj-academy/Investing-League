"use client";

import { usePathname } from "next/navigation";
import { DISCLAIMER } from "@/lib/utils";

const MARKETING_PATHS = ["/", "/about", "/courses", "/course", "/contact"];

export default function SiteFooter() {
  const pathname = usePathname();
  if (MARKETING_PATHS.includes(pathname)) return null;

  return (
    <footer className="z site-footer" style={{ textAlign: "center", fontSize: 10, color: "var(--m3)" }}>
      {DISCLAIMER}
    </footer>
  );
}
