import { EDUCATION_DISCLAIMER, PLANS } from "@/lib/marketing/siteData";
import { MarketingShell } from "./MarketingShell";
import { DisclaimerBox } from "./ui/DisclaimerBox";
import { PricingCard } from "./ui/PricingCard";
import { SectionHeader } from "./ui/SectionHeader";

export function PlansPage() {
  return (
    <MarketingShell active="plans">
      <section className="mkt-hero mkt-hero--compact">
        <div className="mkt-container">
          <div className="mkt-hero-content mkt-hero-content--wide">
            <h1 className="mkt-hero-title">Plans & Access</h1>
            <p className="mkt-hero-lead">
              Choose course learning, Decision Lab scanner access, or a combined bundle.
              Enquire via WhatsApp — no payment gateway on this page.
            </p>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <SectionHeader
            title="Choose Your Plan"
            subtitle="All plans start with a conversation. Our team will guide enrollment and onboarding."
          />
          <div className="mkt-pricing-grid">
            {PLANS.map((plan, i) => (
              <PricingCard
                key={plan.id}
                name={plan.name}
                purpose={plan.purpose}
                includes={plan.includes}
                cta={plan.cta}
                interest={plan.interest}
                featured={i === 1}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-container mkt-prose-narrow">
          <DisclaimerBox>
            {EDUCATION_DISCLAIMER}
          </DisclaimerBox>
          <p className="mkt-muted-text mkt-text-center mkt-stack-top">
            {/* TODO: Payment gateway integration when approved — keep WhatsApp enquiry for now. */}
            Payment integration placeholder: enquire first, pay after team confirmation.
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
