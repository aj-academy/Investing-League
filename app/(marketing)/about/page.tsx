import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { CTAButton } from "@/components/marketing/ui/CTAButton";
import { SectionHeader } from "@/components/marketing/ui/SectionHeader";
import { SITE_TAGLINE } from "@/lib/marketing/siteData";

export const metadata: Metadata = {
  title: "About | The Investing League",
  description:
    "Learn about our education-first mission to make practical finance learning accessible and risk-aware.",
};

export default function AboutPage() {
  return (
    <MarketingShell active="about">
      <section className="mkt-hero mkt-hero--compact">
        <div className="mkt-container">
          <div className="mkt-hero-grid">
            <div className="mkt-hero-content">
              <h1 className="mkt-hero-title">About The Investing League</h1>
              <p className="mkt-hero-lead">{SITE_TAGLINE}</p>
              <div className="mkt-hero-actions">
                <CTAButton href="/courses" variant="gold">Explore Courses</CTAButton>
                <CTAButton href="/decision-lab" variant="outline">Decision Lab</CTAButton>
              </div>
            </div>
            <div className="mkt-hero-media">
              <img src="/group.jpg" alt="People learning about finance" />
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <div className="mkt-grid-2">
            <div className="mkt-info-card">
              <h3>Mission</h3>
              <p>
                Make practical finance education accessible so learners can build
                discipline, confidence, and data-informed habits — without hype.
              </p>
            </div>
            <div className="mkt-info-card">
              <h3>Vision</h3>
              <p>
                A generation of learners who understand money, markets, and risk before
                they make decisions — education first, always.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-container mkt-prose-narrow">
          <SectionHeader title="Education-First Philosophy" align="left" />
          <p className="mkt-muted-text">
            We teach frameworks, habits, and observation skills. Our courses and Decision
            Lab scanner support learning — they are not investment advice, stock
            recommendations, or profit guarantees.
          </p>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <SectionHeader title="Founder / Mentor" />
          <div className="mkt-founder-card mkt-founder-card--large">
            <div className="mkt-founder-avatar mkt-founder-avatar--large" aria-hidden="true" />
            <div>
              <strong>Mentor profile placeholder</strong>
              <p className="mkt-muted-text">
                Add founder name, credentials, experience, and photo here. This section
                is structured for easy replacement with real content.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-container mkt-prose-narrow">
          <SectionHeader title="Why Finance Education Matters" align="left" />
          <p className="mkt-muted-text">
            Financial decisions shape careers, families, and futures. Structured learning
            helps people avoid noise, build discipline, and use data before acting — whether
            managing personal money or observing markets.
          </p>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container mkt-prose-narrow">
          <SectionHeader title="Risk-Aware Learning Approach" align="left" />
          <p className="mkt-muted-text">
            Every program emphasizes risk awareness, journaling, and review habits. We
            do not promote guaranteed outcomes — we promote better decision processes.
          </p>
          <div className="mkt-stack-top">
            <Link href="/contact" className="mkt-link-secondary">
              Contact us to learn more →
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
