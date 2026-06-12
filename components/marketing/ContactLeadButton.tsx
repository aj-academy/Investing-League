"use client";

import { LeadInquiryButton } from "./LeadModal";

export function ContactLeadButton() {
  return (
    <LeadInquiryButton
      showMessage
      title="Contact us"
      className="mkt-btn mkt-btn-primary"
    >
      Message us on WhatsApp
    </LeadInquiryButton>
  );
}
