"use client";

import { usePathname } from "next/navigation";
import { DISCLAIMER } from "@/lib/utils";

export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <footer className="z site-footer" style={{ textAlign: "center", fontSize: 10, color: "var(--m3)" }}>
      {DISCLAIMER}
    </footer>
  );
}
