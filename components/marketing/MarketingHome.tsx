import Link from "next/link";
import { CourseGrid } from "./CourseGrid";
import { HeroActions } from "./HeroActions";
import { LeadInquiryButton } from "./LeadModal";
import { MarketingShell } from "./MarketingShell";
import { SectionHeading } from "./SectionHeading";

const HOME_COURSE_DESCRIPTIONS: Record<string, string> = {
  "Money Made Simple": "Master your money with clear, practical steps.",
  "Foundation of Wealth": "Chart patterns, indicators, and data-driven decisions.",
  "The Wealth Builder": "Advanced strategies and risk management for growth.",
  "Income Accelerator": "Analyze companies and find investment opportunities.",
  "Market Warrior": "Build and manage a diversified long-term portfolio.",
  "Smart Risk, Smart Profit": "Risk-aware trading with disciplined execution.",
  "Legacy & Wealth Psychology": "Mindset and legacy planning for lasting wealth.",
  "Wealth Her Way": "Financial empowerment tailored for women.",
  "Smart Mom, Smart Money": "Practical money skills for mothers and families.",
};

const VALUES = [
  { title: "Accessibility", desc: "Making financial education available to all" },
  { title: "Practicality", desc: "Teaching skills that can be immediately applied" },
  { title: "Empowerment", desc: "Enabling financial independence and growth" },
  { title: "Integrity", desc: "Providing honest, transparent guidance" },
];

const WHY_CHOOSE = [
  {
    title: "Learning by Doing",
    desc: "Hands-on practice with live examples and market simulations.",
  },
  {
    title: "Rooted in Real Life",
    desc: "Financial concepts connected to your personal goals.",
  },
  {
    title: "Community that cares",
    desc: "A supportive learner community that keeps you accountable.",
  },
  {
    title: "Made for Today’s Youth",
    desc: "Designed for students and young professionals.",
  },
];

export function MarketingHome() {
  return (
    <MarketingShell active="home">
      <section className="mkt-hero">
        <div className="mkt-container">
          <div className="mkt-hero-grid">
            <div className="mkt-hero-content">
              <h1 className="mkt-hero-title">The real profit lies in knowledge</h1>
              <p className="mkt-hero-lead">
                We teach people how to grow wealth through knowledge and smart investing.
              </p>
              <HeroActions />
            </div>
            <div className="mkt-hero-media">
              <img src="/group.jpg" alt="People learning about investing" />
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--white">
        <div className="mkt-container">
          <SectionHeading title="Our Vision & Mission" />
          <div className="mkt-grid-2">
            <div className="mkt-info-card">
              <h3>Our Vision</h3>
              <p>To make financial literacy a life skill for everyone</p>
            </div>
            <div className="mkt-info-card">
              <h3>Our Mission</h3>
              <p>We teach people how to grow wealth through knowledge and smart investing.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--muted">
        <div className="mkt-container">
          <SectionHeading title="About Us" />
          <div className="mkt-split">
            <div className="mkt-split-text">
              <p>
                At The Investing League, we&apos;re on a mission to transform how young people
                perceive and manage money. Financial literacy isn&apos;t just for experts — it&apos;s
                for everyone ready to take control of their future.
              </p>
              <p>
                We simplify trading, investing, insurance, and budgeting into actionable steps for
                beginners and intermediates alike.
              </p>
            </div>
            <div className="mkt-split-media">
              <img src="/proff.jpg" alt="Founder teaching" />
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--white">
        <div className="mkt-container">
          <SectionHeading title="Our Core Values" />
          <div className="mkt-grid-4">
            {VALUES.map((v) => (
              <div key={v.title} className="mkt-value-card">
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--muted">
        <div className="mkt-container">
          <SectionHeading
            title="Our Courses"
            subtitle="Explore our comprehensive range of courses designed to help you master investing and trading."
          />
          <CourseGrid descriptions={HOME_COURSE_DESCRIPTIONS} />
          <div className="mkt-section-cta">
            <Link href="/courses" className="mkt-btn mkt-btn-outline">
              View all courses
            </Link>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--white">
        <div className="mkt-container">
          <SectionHeading title="Why Choose The Investing League" />
          <div className="mkt-grid-2">
            {WHY_CHOOSE.map((item) => (
              <div key={item.title} className="mkt-feature-card">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--tint" id="cta-enroll">
        <div className="mkt-container">
          <div className="mkt-cta-panel">
            <div className="mkt-cta-content">
              <h2>Ready to start your investing journey?</h2>
              <p>
                Tell us what you&apos;re interested in — we&apos;ll open WhatsApp with your details
                ready to send.
              </p>
              <LeadInquiryButton className="mkt-btn mkt-btn-primary mkt-btn-lg" title="Enrollment enquiry">
                Contact us on WhatsApp
              </LeadInquiryButton>
            </div>
            <div className="mkt-cta-media">
              <img src="/group.jpg" alt="" />
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
