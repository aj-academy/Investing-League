"use client";

import { openWhatsAppPreset } from "@/lib/marketing/whatsapp";

export function WhatsAppQuickButton({
  preset,
  children,
  className,
}: {
  preset: "course" | "scanner" | "bundle" | "general";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className ?? "mkt-btn mkt-btn-primary"}
      onClick={() => openWhatsAppPreset(preset)}
    >
      {children}
    </button>
  );
}
