import type { Metadata } from "next";
import { ContactLeadButton } from "@/components/marketing/ContactLeadButton";
import { LeadInquiryButton } from "@/components/marketing/LeadModal";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { SectionHeading } from "@/components/marketing/SectionHeading";

export const metadata: Metadata = {
  title: "Contact — The Investing League",
  description: "Contact The Investing League via WhatsApp.",
};

export default function ContactPage() {
  return (
    <MarketingShell active="contact">
      <section className="mkt-section mkt-section--white">
        <div className="mkt-container">
          <SectionHeading
            title="Contact us"
            subtitle="Fill in a short form — we'll open WhatsApp with your message ready to send."
          />

          <div className="mkt-grid-2">
            <div className="mkt-feature-card">
              <h3>Message us</h3>
              <p className="mkt-card-lead">
                Include your name, email, contact number, and what you&apos;re interested in — a
                course or scanner access.
              </p>
              <LeadInquiryButton
                showMessage
                title="Contact us"
                className="mkt-btn mkt-btn-primary mkt-btn-block"
              >
                Open enquiry form
              </LeadInquiryButton>
            </div>
            <div>
              <div className="mkt-feature-card mkt-stack-gap">
                <h3>WhatsApp</h3>
                <p className="mkt-card-lead">Fastest way to reach our team.</p>
                <ContactLeadButton />
              </div>
              <div className="mkt-feature-card">
                <h3>Office</h3>
                <p>Chennai, Tamil Nadu, India</p>
                <p>info@investingleague.info</p>
                <p>+91 93614 89738</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
