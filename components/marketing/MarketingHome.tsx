import Link from "next/link";
import {
  DECISION_LAB_FEATURES,
  POPULAR_COURSE_SLUGS,
  getCourseBySlug,
} from "@/lib/marketing/siteData";
import {
  COMPLIANCE_DISCLAIMER,
  HERO_TRUST_LINE,
  WHY_LEARNERS_TRUST,
} from "@/lib/marketing/compliance";
import { MarketingShell } from "./MarketingShell";
import { FounderSection } from "./FounderSection";
import { HomeHeroCTAs } from "./HomeHeroCTAs";
import { PathCards } from "./PathCards";
import { CTAButton } from "./ui/CTAButton";
import { DisclaimerBox } from "./ui/DisclaimerBox";
import { FeatureCard } from "./ui/FeatureCard";
import { SectionHeader } from "./ui/SectionHeader";
import { WhatsAppQuickButton } from "./ui/WhatsAppQuickButton";
import { CourseCard } from "./ui/CourseCard";

const popularCourses = POPULAR_COURSE_SLUGS.map((slug) =>
  getCourseBySlug(slug)!
);

export function MarketingHome() {
  return (
    <MarketingShell active="home">
      <section className="mkt-hero mkt-hero--premium">
        <div className="mkt-container">
          <div className="mkt-hero-grid">
            <div className="mkt-hero-content">
              <p className="mkt-hero-eyebrow">Finance Learning + Educational Decision Lab</p>
              <h1 className="mkt-hero-title">
                Learn Finance Practically. Build Market Discipline. Use Data Before Decisions.
              </h1>
              <p className="mkt-hero-lead">
                The Investing League helps beginners, students, professionals, and market learners
                understand finance, manage risk, and use an educational Decision Lab for structured
                market observation and journaling.
              </p>
              <HomeHeroCTAs />
              <p className="mkt-hero-trust">{HERO_TRUST_LINE}</p>
            </div>
            <div className="mkt-hero-media mkt-hero-media--glow">
              <img src="/group.jpg" alt="Students learning finance with The Investing League" />
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <SectionHeader title="Choose Your Path" />
          <PathCards />
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-container">
          <SectionHeader title="Why Learners Trust The Investing League" />
          <ul className="mkt-check-list mkt-trust-checklist">
            {WHY_LEARNERS_TRUST.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <SectionHeader title="Founder / Mentor" />
          <FounderSection large />
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-container">
          <SectionHeader
            title="Popular Finance Courses"
            subtitle="Beginner-friendly programs for personal finance, wealth building, and market learning in India."
          />
          <div className="mkt-course-grid mkt-course-grid--home">
            {popularCourses.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
          <div className="mkt-section-cta">
            <CTAButton href="/courses" variant="outline">View All Courses</CTAButton>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <SectionHeader
            title="Decision Lab Preview"
            subtitle="An educational market observation tool for journaling and discipline — not investment advice and not a profit guarantee."
          />
          <div className="mkt-grid-3">
            {DECISION_LAB_FEATURES.map((f) => (
              <FeatureCard key={f.title} title={f.title} description={f.desc} />
            ))}
          </div>
          <div className="mkt-section-cta">
            <CTAButton href="/decision-lab" variant="gold">Explore Decision Lab</CTAButton>
            <CTAButton href="/plans" variant="outline">View Plans</CTAButton>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-container mkt-prose-narrow">
          <DisclaimerBox>{COMPLIANCE_DISCLAIMER}</DisclaimerBox>
        </div>
      </section>

      <section className="mkt-section mkt-final-cta">
        <div className="mkt-container mkt-final-cta-inner">
          <h2>Ready to start your finance learning journey?</h2>
          <div className="mkt-hero-actions">
            <CTAButton href="/courses" variant="gold" size="lg">
              Start Learning Finance
            </CTAButton>
            <WhatsAppQuickButton
              preset="mentor"
              className="mkt-btn mkt-btn-outline mkt-btn-lg"
            >
              Talk to Mentor on WhatsApp
            </WhatsAppQuickButton>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
