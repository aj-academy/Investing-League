"use client";

import Link from "next/link";
import { CTAButton } from "./ui/CTAButton";
import { LeadInquiryButton } from "./LeadModal";
import { WhatsAppQuickButton } from "./ui/WhatsAppQuickButton";

export function HomeHeroCTAs() {
  return (
    <div className="mkt-hero-actions mkt-hero-actions--stack">
      <CTAButton href="/courses" variant="gold" size="lg">
        Start Learning Finance
      </CTAButton>
      <LeadInquiryButton
        interest="Decision Lab"
        title="Request Decision Lab Demo"
        className="mkt-btn mkt-btn-outline mkt-btn-lg"
      >
        Request Decision Lab Demo
      </LeadInquiryButton>
      <WhatsAppQuickButton
        preset="mentor"
        className="mkt-btn mkt-btn-outline mkt-btn-lg"
      >
        Talk to Mentor on WhatsApp
      </WhatsAppQuickButton>
    </div>
  );
}
