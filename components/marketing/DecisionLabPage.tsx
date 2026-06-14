import Link from "next/link";
import {
  DECISION_LAB_FEATURES,
  DECISION_LAB_FAQS,
  SCANNER_DISCLAIMER,
} from "@/lib/marketing/siteData";
import { MarketingShell } from "./MarketingShell";
import { CTAButton } from "./ui/CTAButton";
import { DisclaimerBox } from "./ui/DisclaimerBox";
import { FAQAccordion } from "./ui/FAQAccordion";
import { FeatureCard } from "./ui/FeatureCard";
import { SectionHeader } from "./ui/SectionHeader";

export function DecisionLabPage() {
  return (
    <MarketingShell active="decision-lab">
      <section className="mkt-hero mkt-hero--premium">
        <div className="mkt-container">
          <div className="mkt-hero-content mkt-hero-content--wide">
            <p className="mkt-hero-eyebrow">Decision Lab</p>
            <h1 className="mkt-hero-title">
              Decision Lab: Educational Market Scanner for Disciplined Learning
            </h1>
            <p className="mkt-hero-lead">
              Observe market conditions, test signals, track decisions, and build risk
              awareness. Built for learning, not profit guarantees.
            </p>
            <div className="mkt-hero-actions">
              <CTAButton href="/plans" variant="gold" size="lg">View Plans</CTAButton>
              <Link href="/login" className="mkt-btn mkt-btn-outline mkt-btn-lg">
                Member Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container mkt-prose-narrow">
          <SectionHeader title="What is Decision Lab?" align="left" />
          <p className="mkt-muted-text">
            Decision Lab is an educational market observation dashboard and
            decision-support tool. Members use it to observe conditions, test signal
            discipline, journal decisions, and build risk awareness — as part of a
            learning journey, not as investment advice.
          </p>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-container">
          <SectionHeader title="Who Is It For?" />
          <div className="mkt-grid-2">
            <div className="mkt-feature-card">
              <h3>Learners & students</h3>
              <p>Structured observation habits alongside course learning.</p>
            </div>
            <div className="mkt-feature-card">
              <h3>Traders building discipline</h3>
              <p>Signal testing and journaling without hype or guaranteed outcomes.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <SectionHeader title="What It Helps With" />
          <div className="mkt-grid-3">
            {DECISION_LAB_FEATURES.map((f) => (
              <FeatureCard key={f.title} title={f.title} description={f.desc} />
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-container mkt-prose-narrow">
          <SectionHeader title="What It Does Not Do" align="left" />
          <ul className="mkt-check-list mkt-check-list--x">
            <li>Provide investment advice or stock recommendations</li>
            <li>Guarantee profit or fixed returns</li>
            <li>Offer buy/sell calls or sure-shot signals</li>
            <li>Replace your own research and risk decisions</li>
          </ul>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <SectionHeader title="Sample Scanner Preview" />
          <div className="mkt-scanner-preview mkt-scanner-preview--large">
            <div className="mkt-scanner-preview-bar">
              <span>Market observation</span>
              <span className="mkt-scanner-preview-tag">Learning-based access</span>
            </div>
            <div className="mkt-scanner-preview-body">
              <div className="mkt-scanner-preview-col">
                <div className="mkt-scanner-preview-line" />
                <div className="mkt-scanner-preview-line short" />
                <div className="mkt-scanner-preview-line" />
                <div className="mkt-scanner-preview-line" />
              </div>
              <div className="mkt-scanner-preview-chart" />
            </div>
          </div>
          <p className="mkt-muted-text mkt-text-center">
            Full scanner access is available to members after login and onboarding.
          </p>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-container mkt-prose-narrow">
          <DisclaimerBox variant="warning">
            <strong>Disclaimer:</strong> {SCANNER_DISCLAIMER}
          </DisclaimerBox>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container mkt-prose-narrow">
          <SectionHeader title="FAQ" align="left" />
          <FAQAccordion items={DECISION_LAB_FAQS} />
        </div>
      </section>

      <section className="mkt-section mkt-final-cta">
        <div className="mkt-container mkt-final-cta-inner">
          <h2>Ready for learning-based scanner access?</h2>
          <div className="mkt-hero-actions">
            <CTAButton href="/plans" variant="gold" size="lg">View Plans</CTAButton>
            <Link href="/login" className="mkt-btn mkt-btn-outline mkt-btn-lg">
              Member Login
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
