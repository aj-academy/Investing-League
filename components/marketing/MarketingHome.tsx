import Link from "next/link";
import {
  COURSES,
  DECISION_LAB_FEATURES,
  POPULAR_COURSE_SLUGS,
  TESTIMONIALS,
  WHO_WE_HELP,
  WHY_CHOOSE,
  WORKSHOP_HIGHLIGHTS,
  getCourseBySlug,
} from "@/lib/marketing/siteData";
import { MarketingShell } from "./MarketingShell";
import { CTAButton } from "./ui/CTAButton";
import { DisclaimerBox } from "./ui/DisclaimerBox";
import { FeatureCard } from "./ui/FeatureCard";
import { SectionHeader } from "./ui/SectionHeader";
import { TestimonialCard } from "./ui/TestimonialCard";
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
              <p className="mkt-hero-eyebrow">The Investing League</p>
              <h1 className="mkt-hero-title">
                Learn Finance. Build Discipline. Use Data Before Decisions.
              </h1>
              <p className="mkt-hero-lead">
                The Investing League helps beginners, students, professionals, and
                traders learn finance practically through structured courses and an
                educational market decision lab.
              </p>
              <div className="mkt-hero-actions">
                <CTAButton href="/courses" variant="gold" size="lg">
                  Explore Courses
                </CTAButton>
                <CTAButton href="/decision-lab" variant="outline" size="lg">
                  View Decision Lab
                </CTAButton>
              </div>
              <p className="mkt-hero-trust">
                Education-first platform | Scanner access for learning and market
                observation only
              </p>
            </div>
            <div className="mkt-hero-media mkt-hero-media--glow">
              <img src="/group.jpg" alt="People learning about finance" />
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <SectionHeader title="Choose Your Path" />
          <div className="mkt-grid-2 mkt-path-grid">
            <article className="mkt-path-card">
              <h3>Learn Finance & Investing</h3>
              <p>
                Structured programs for beginners, students, working professionals,
                women, and aspiring market learners.
              </p>
              <CTAButton href="/courses" variant="primary">View Courses</CTAButton>
            </article>
            <article className="mkt-path-card mkt-path-card--accent">
              <h3>Use Decision Lab Scanner</h3>
              <p>
                An educational market observation tool for signal testing,
                journaling, discipline, and risk awareness.
              </p>
              <CTAButton href="/decision-lab" variant="gold">Explore Scanner</CTAButton>
            </article>
          </div>
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
        <div className="mkt-container">
          <SectionHeader
            title="Popular Courses"
            subtitle="Outcome-focused programs — enquire for syllabus and enrollment details."
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

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-container">
          <SectionHeader
            title="Decision Lab Preview"
            subtitle="Decision Lab is not a profit-guarantee tool. It is an educational scanner built to help users observe market conditions, test signal discipline, and maintain better decision-making habits."
          />
          <div className="mkt-grid-3">
            {DECISION_LAB_FEATURES.map((f) => (
              <FeatureCard key={f.title} title={f.title} description={f.desc} />
            ))}
          </div>
          <div className="mkt-scanner-preview" aria-hidden="true">
            <div className="mkt-scanner-preview-bar">
              <span>Decision Lab</span>
              <span className="mkt-scanner-preview-tag">Educational view</span>
            </div>
            <div className="mkt-scanner-preview-body">
              <div className="mkt-scanner-preview-col">
                <div className="mkt-scanner-preview-line" />
                <div className="mkt-scanner-preview-line short" />
                <div className="mkt-scanner-preview-line" />
              </div>
              <div className="mkt-scanner-preview-chart" />
            </div>
          </div>
          <div className="mkt-section-cta">
            <CTAButton href="/plans" variant="gold">View Scanner Plans</CTAButton>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <SectionHeader title="Why Choose The Investing League" />
          <div className="mkt-grid-3">
            {WHY_CHOOSE.map((item) => (
              <FeatureCard key={item.title} title={item.title} description={item.desc} />
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-container">
          <SectionHeader title="Trust & Proof" />
          <div className="mkt-trust-grid">
            <div className="mkt-trust-block">
              <h3>Student testimonials</h3>
              <div className="mkt-stack-gap">
                {TESTIMONIALS.map((t) => (
                  <TestimonialCard key={t.name} {...t} />
                ))}
              </div>
            </div>
            <div className="mkt-trust-block">
              <h3>Workshop & training highlights</h3>
              <ul className="mkt-check-list">
                {WORKSHOP_HIGHLIGHTS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h3 className="mkt-trust-subhead">Founder / mentor</h3>
              <div className="mkt-founder-card">
                <div className="mkt-founder-avatar" aria-hidden="true" />
                <div>
                  <strong>Mentor profile</strong>
                  <p>
                    Placeholder — add founder bio, credentials, and photo here.
                  </p>
                </div>
              </div>
              <h3 className="mkt-trust-subhead">Community learning</h3>
              <p className="mkt-muted-text">
                Learners connect through workshops, WhatsApp support, and shared
                accountability — education-first, not signal chasing.
              </p>
              <h3 className="mkt-trust-subhead">Certificate / sample outcome</h3>
              <p className="mkt-muted-text">
                Certificate and outcome samples shared during enrollment enquiry.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-final-cta">
        <div className="mkt-container mkt-final-cta-inner">
          <h2>Ready to start your finance learning journey?</h2>
          <div className="mkt-hero-actions">
            <CTAButton href="/courses" variant="gold" size="lg">
              Explore Courses
            </CTAButton>
            <WhatsAppQuickButton
              preset="general"
              className="mkt-btn mkt-btn-outline mkt-btn-lg"
            >
              Talk on WhatsApp
            </WhatsAppQuickButton>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
