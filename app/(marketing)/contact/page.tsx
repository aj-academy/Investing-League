import type { Metadata } from "next";
import { ContactEnquiryForm } from "@/components/marketing/ContactEnquiryForm";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { SectionHeader } from "@/components/marketing/ui/SectionHeader";
import { WhatsAppQuickButton } from "@/components/marketing/ui/WhatsAppQuickButton";
import { CONTACT_INFO } from "@/lib/marketing/siteData";
import { buildWhatsAppUrl, WHATSAPP_PRESETS } from "@/lib/marketing/whatsapp";

export const metadata: Metadata = {
  title: "Contact | The Investing League",
  description:
    "Contact The Investing League for course, Decision Lab, and bundle enquiries via WhatsApp.",
};

export default function ContactPage() {
  const waHref = buildWhatsAppUrl(WHATSAPP_PRESETS.general);

  return (
    <MarketingShell active="contact">
      <section className="mkt-section">
        <div className="mkt-container">
          <SectionHeader
            title="Contact Us"
            subtitle="Enquire about courses, Decision Lab access, bundles, or workshops. We'll open WhatsApp with your message ready to send."
          />

          <div className="mkt-grid-2 mkt-contact-grid">
            <div className="mkt-feature-card">
              <h3>Enquiry form</h3>
              <ContactEnquiryForm />
            </div>
            <div>
              <div className="mkt-feature-card mkt-stack-gap">
                <h3>WhatsApp</h3>
                <p className="mkt-muted-text">Fastest way to reach our team.</p>
                <WhatsAppQuickButton preset="general">
                  Message on WhatsApp
                </WhatsAppQuickButton>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mkt-link-secondary"
                >
                  Open WhatsApp directly
                </a>
              </div>
              <div className="mkt-feature-card">
                <h3>Details</h3>
                <ul className="mkt-footer-links">
                  <li>{CONTACT_INFO.location}</li>
                  <li>
                    <a href={`mailto:${CONTACT_INFO.email}`}>{CONTACT_INFO.email}</a>
                  </li>
                  <li>{CONTACT_INFO.phone}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
