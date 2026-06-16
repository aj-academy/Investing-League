"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { InspectGuard } from "./InspectGuard";

const MARKETING_PREFIXES = [
  "/about",
  "/blog",
  "/courses",
  "/contact",
  "/decision-lab",
  "/plans",
  "/privacy",
];

function isMarketingPath(pathname: string) {
  if (pathname === "/") return true;
  return MARKETING_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Skip inspect protection on public marketing pages (faster loads, no auth call).
 * Scanner/dashboard routes keep the guard; admins are exempt via API check.
 */
export function InspectGuardRoot() {
  const pathname = usePathname();
  const [adminExempt, setAdminExempt] = useState(false);

  useEffect(() => {
    if (isMarketingPath(pathname)) return;
    let cancelled = false;
    fetch("/api/auth/is-admin", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: { isAdmin?: boolean }) => {
        if (!cancelled) setAdminExempt(Boolean(json.isAdmin));
      })
      .catch(() => {
        if (!cancelled) setAdminExempt(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (isMarketingPath(pathname)) return null;

  return <InspectGuard enabled={!adminExempt} />;
}
