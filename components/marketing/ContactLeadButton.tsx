"use client";

import { LeadInquiryButton } from "./LeadModal";

export function ContactLeadButton() {
  return (
    <LeadInquiryButton
      showMessage
      title="Contact us"
      className="inline-flex items-center gap-2 bg-green-500 text-white px-5 py-2 rounded hover:bg-green-600 font-semibold"
    >
      Message us on WhatsApp
    </LeadInquiryButton>
  );
}
