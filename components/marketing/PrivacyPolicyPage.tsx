import {
  PRIVACY_POLICY_EFFECTIVE_DATE,
  PRIVACY_POLICY_SECTIONS,
} from "@/lib/marketing/privacyPolicy";
import { MarketingShell } from "./MarketingShell";
import { CTAButton } from "./ui/CTAButton";

export function PrivacyPolicyPage() {
  return (
    <MarketingShell active="home">
      <section className="mkt-hero mkt-hero--compact">
        <div className="mkt-container">
          <div className="mkt-hero-content mkt-hero-content--wide">
            <h1 className="mkt-hero-title">Privacy Policy</h1>
            <p className="mkt-hero-lead">
              How The Investing League collects, uses, and protects your information —
              including courses, enquiries, and Decision Lab scanner member access.
            </p>
            <p className="mkt-muted-text">
              Effective date: {PRIVACY_POLICY_EFFECTIVE_DATE}
            </p>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container mkt-legal-doc">
          {PRIVACY_POLICY_SECTIONS.map((section) => (
            <article key={section.id} className="mkt-legal-section" id={section.id}>
              <h2>{section.title}</h2>
              {"paragraphs" in section &&
                section.paragraphs.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              {"bullets" in section && (
                <ul className="mkt-legal-list">
                  {section.bullets.map((item) => (
                    <li key={item.slice(0, 48)}>{item}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
          <div className="mkt-legal-actions">
            <CTAButton href="/contact" variant="outline">Contact us</CTAButton>
            <CTAButton href="/decision-lab" variant="gold">About Decision Lab</CTAButton>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
