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
      <section className="hero-section py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="hero-inner">
            <div className="hero-copy">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
                The real profit lies in knowledge
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
                We teach people how to grow wealth through knowledge and smart investing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/#cta-enroll"
                  className="bg-primary text-white px-6 py-3 rounded-lg whitespace-nowrap hover:bg-primary/90 font-semibold text-center"
                >
                  Start Learning Now
                </Link>
                <Link
                  href="/courses"
                  className="bg-white text-primary border border-primary px-6 py-3 rounded-lg whitespace-nowrap hover:bg-gray-50 font-semibold text-center"
                >
                  Explore Courses
                </Link>
              </div>
            </div>
            <div className="hero-visual">
              <img src="/group.jpg" alt="People learning about investing" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-gray-700 text-lg space-y-6">
          <p>
            At The Investing League, we&apos;re on a mission to transform how young people perceive
            and manage money. We believe financial literacy isn&apos;t just for experts — it&apos;s for
            everyone who&apos;s ready to take control of their future.
          </p>
          <p>
            Our courses simplify trading and investing, breaking complex concepts into easy,
            actionable steps. Whether you&apos;re a beginner or sharpening your skills, we provide the
            tools and knowledge to build sustainable wealth.
          </p>
          <p>
            What makes us different: hands-on learning with live examples, a community-driven
            approach, industry-recognized certification, and courses tailored for real-life needs —
            student finance, women&apos;s wealth, smart risk-taking, and legacy planning.
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
