import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost" | "gold";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "mkt-btn mkt-btn-primary",
  outline: "mkt-btn mkt-btn-outline",
  ghost: "mkt-btn mkt-btn-ghost",
  gold: "mkt-btn mkt-btn-gold",
};

export function CTAButton({
  href,
  children,
  variant = "primary",
  className,
  size,
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  size?: "sm" | "lg";
}) {
  const sizeClass = size === "sm" ? " mkt-btn-sm" : size === "lg" ? " mkt-btn-lg" : "";
  return (
    <Link
      href={href}
      className={`${VARIANT_CLASS[variant]}${sizeClass}${className ? ` ${className}` : ""}`}
    >
      {children}
    </Link>
  );
}
