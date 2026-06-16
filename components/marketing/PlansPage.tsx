import { PLANS } from "@/lib/marketing/siteData";
import { COMPLIANCE_DISCLAIMER, FOOTER_DISCLAIMER } from "@/lib/marketing/compliance";
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
            <h1 className="mkt-hero-title">Courses & Decision Lab Plans</h1>
            <p className="mkt-hero-lead">
              Choose finance learning, Decision Lab access, mentor guidance, or a combined bundle.
              Pricing is shared on enquiry — no fake prices displayed here.
            </p>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <SectionHeader
            title="Choose Your Learning Path"
            subtitle="Our team will guide enrollment, onboarding, and the right fit for your experience level."
          />
          <div className="mkt-pricing-grid mkt-pricing-grid--quad">
            {PLANS.map((plan, i) => (
              <PricingCard
                key={plan.id}
                name={plan.name}
                bestFor={plan.bestFor}
                purpose={plan.purpose}
                includes={plan.includes}
                cta={plan.cta}
                interest={plan.interest}
                priceNote={plan.priceNote}
                featured={i === 2}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-container mkt-prose-narrow">
          <DisclaimerBox>{COMPLIANCE_DISCLAIMER}</DisclaimerBox>
          <p className="mkt-muted-text mkt-text-center mkt-stack-top">
            {/* TODO: Payment gateway integration when approved — enquire via WhatsApp for now. */}
            {FOOTER_DISCLAIMER}
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
