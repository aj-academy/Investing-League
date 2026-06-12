import type { Metadata } from "next";
import { ContactLeadButton } from "@/components/marketing/ContactLeadButton";
import { LeadInquiryButton } from "@/components/marketing/LeadModal";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Contact — The Investing League",
  description: "Contact The Investing League via WhatsApp.",
};

export default function ContactPage() {
  return (
    <MarketingShell active="contact">
      <section className="py-16 w-full">
        <div className="mkt-container">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Contact us</h1>
            <div className="w-20 h-1 bg-primary mx-auto mb-6" />
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Fill in a short form — we&apos;ll open WhatsApp with your message ready to send.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Message us</h2>
              <p className="text-gray-600 text-sm mb-6">
                Include your name, email, contact number, and what you&apos;re interested in — course
                or scanner access.
              </p>
              <LeadInquiryButton
                showMessage
                title="Contact us"
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90"
              >
                Open enquiry form
              </LeadInquiryButton>
            </div>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-gray-900 mb-2">WhatsApp</h3>
                <p className="text-gray-600 text-sm mb-4">Fastest way to reach our team.</p>
                <ContactLeadButton />
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-gray-700 space-y-3">
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
