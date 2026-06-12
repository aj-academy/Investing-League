import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "About Us — The Investing League",
  description: "Learn about our mission to make financial literacy a life skill for everyone.",
};

export default function AboutPage() {
  return (
    <MarketingShell active="about">
      <section className="mkt-hero">
        <div className="mkt-container">
          <div className="mkt-hero-grid">
            <div className="mkt-hero-content">
              <h1 className="mkt-hero-title">The real profit lies in knowledge</h1>
              <p className="mkt-hero-lead">
                We teach people how to grow wealth through knowledge and smart investing.
              </p>
              <div className="mkt-hero-actions">
                <Link href="/#cta-enroll" className="mkt-btn mkt-btn-primary">
                  Start Learning Now
                </Link>
                <Link href="/courses" className="mkt-btn mkt-btn-outline">
                  Explore Courses
                </Link>
              </div>
            </div>
            <div className="mkt-hero-media">
              <img src="/group.jpg" alt="People learning about investing" />
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--white">
        <div className="mkt-container">
          <div className="mkt-split-text mkt-prose-narrow">
            <p>
              At The Investing League, we&apos;re on a mission to transform how young people perceive
              and manage money. Financial literacy isn&apos;t just for experts — it&apos;s for everyone
              ready to take control of their future.
            </p>
            <p>
              Our courses simplify trading and investing, breaking complex concepts into easy,
              actionable steps. Whether you&apos;re a beginner or sharpening your skills, we provide
              the tools and knowledge to build sustainable wealth.
            </p>
            <p>
              What makes us different: hands-on learning with live examples, a community-driven
              approach, industry-recognized certification, and courses tailored for real-life needs.
            </p>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
