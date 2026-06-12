"use client";

import Link from "next/link";
import { LeadInquiryButton } from "./LeadModal";

export function HeroActions() {
  return (
    <div className="mkt-hero-actions">
      <LeadInquiryButton
        id="cta-enroll"
        className="mkt-btn mkt-btn-primary"
        title="Start your journey"
      >
        Start Learning Now
      </LeadInquiryButton>
      <Link href="/scanner" className="mkt-btn mkt-btn-outline">
        View Market Scanner
      </Link>
      <Link href="/courses" className="mkt-btn mkt-btn-outline mkt-btn-desktop-only">
        Explore Courses
      </Link>
    </div>
  );
}
