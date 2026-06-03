"use client";

import { usePathname } from "next/navigation";
import { DISCLAIMER } from "@/lib/utils";

export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <footer className="z" style={{ textAlign: "center", padding: "20px", fontSize: 10, color: "var(--m3)" }}>
      {DISCLAIMER}
    </footer>
  );
}
