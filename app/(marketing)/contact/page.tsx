import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/ContactForm";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { buildWhatsAppUrl } from "@/lib/marketing/whatsapp";

export const metadata: Metadata = {
  title: "Contact — The Investing League",
  description: "Contact The Investing League via WhatsApp for syllabus and enrollment.",
};

const whatsappDirect = buildWhatsAppUrl(
  "Hello The Investing League team, I would like to get in touch. Thank you."
);

export default function ContactPage() {
  return (
    <MarketingShell active="contact">
      <section className="py-16 w-full">
        <div className="mkt-container">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Contact us</h1>
            <div className="w-20 h-1 bg-primary mx-auto mb-6" />
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Send your question on WhatsApp — we reply from our team chat. No backend forms.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Message us</h2>
              <ContactForm />
            </div>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-gray-900 mb-2">WhatsApp</h3>
                <p className="text-gray-600 text-sm mb-4">Fastest way for syllabus and enrollment.</p>
                <a
                  href={whatsappDirect}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-500 text-white px-5 py-2 rounded hover:bg-green-600"
                >
                  Chat on WhatsApp
                </a>
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
