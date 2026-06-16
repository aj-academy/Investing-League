import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { FounderSection } from "@/components/marketing/FounderSection";
import { CTAButton } from "@/components/marketing/ui/CTAButton";
import { DisclaimerBox } from "@/components/marketing/ui/DisclaimerBox";
import { SectionHeader } from "@/components/marketing/ui/SectionHeader";
import {
  ABOUT_WE_DO_NOT,
  COMPLIANCE_DISCLAIMER,
} from "@/lib/marketing/compliance";
import { WHO_WE_HELP } from "@/lib/marketing/siteData";
import { PAGE_SEO } from "@/lib/marketing/seo";

export const metadata: Metadata = {
  title: PAGE_SEO.about.title,
  description: PAGE_SEO.about.description,
};

export default function AboutPage() {
  return (
    <MarketingShell active="about">
      <section className="mkt-hero mkt-hero--compact">
        <div className="mkt-container">
          <div className="mkt-hero-content mkt-hero-content--wide">
            <h1 className="mkt-hero-title">About The Investing League</h1>
            <p className="mkt-hero-lead">
              The Investing League is a finance education and decision-discipline platform created
              to help learners build money awareness, market understanding, and structured
              decision-making habits.
            </p>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container mkt-prose-narrow">
          <SectionHeader title="Our Mission" align="left" />
          <p className="mkt-muted-text">
            Make practical finance education accessible so learners can build discipline,
            confidence, and data-informed habits — without hype, tips, or profit promises.
          </p>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-container mkt-prose-narrow">
          <SectionHeader title="What We Teach" align="left" />
          <ul className="mkt-check-list">
            <li>Personal finance and money management foundations</li>
            <li>Wealth building and long-term planning concepts</li>
            <li>Market learning with risk awareness and journaling</li>
            <li>Decision Lab for educational observation and discipline</li>
          </ul>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container mkt-prose-narrow">
          <SectionHeader title="What We Do Not Do" align="left" />
          <ul className="mkt-check-list mkt-check-list--x">
            {ABOUT_WE_DO_NOT.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-container">
          <SectionHeader title="Who We Help" />
          <div className="mkt-grid-3">
            {WHO_WE_HELP.map((item) => (
              <article key={item.title} className="mkt-value-card">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container mkt-prose-narrow">
          <SectionHeader title="Why Discipline Matters" align="left" />
          <p className="mkt-muted-text">
            Markets involve uncertainty. Education and journaling help learners slow down,
            observe setups, note risk, and review decisions — instead of reacting emotionally or
            following blind tips.
          </p>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-container">
          <SectionHeader title="Founder / Mentor" />
          <FounderSection large />
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container mkt-prose-narrow">
          <DisclaimerBox>{COMPLIANCE_DISCLAIMER}</DisclaimerBox>
          <div className="mkt-legal-actions mkt-stack-top">
            <CTAButton href="/contact" variant="gold">Talk to Mentor</CTAButton>
            <CTAButton href="/courses" variant="outline">Explore Courses</CTAButton>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
