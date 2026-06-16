"use client";

import { openWhatsAppPreset } from "@/lib/marketing/whatsapp";

export function StickyWhatsApp() {
  return (
    <button
      type="button"
      className="mkt-sticky-wa"
      aria-label="Talk to mentor on WhatsApp"
      onClick={() => openWhatsAppPreset("mentor")}
    >
      <span className="mkt-sticky-wa-icon" aria-hidden="true">💬</span>
      <span className="mkt-sticky-wa-text">Talk to Mentor</span>
    </button>
  );
}
