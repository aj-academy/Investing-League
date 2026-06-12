import type { Metadata } from "next";
import { CourseGrid } from "@/components/marketing/CourseGrid";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { SectionHeading } from "@/components/marketing/SectionHeading";

export const metadata: Metadata = {
  title: "Courses — The Investing League",
  description: "Explore our range of investing and trading courses.",
};

const COURSE_PAGE_DESCRIPTIONS: Record<string, string> = {
  "Money Made Simple": "Master your money, one step at a time.",
  "Foundation of Wealth": "Chart patterns, indicators, and technical trading strategies.",
  "The Wealth Builder": "Advanced strategies, risk management, and income generation.",
  "Income Accelerator": "Analyze financial statements and find undervalued opportunities.",
  "Market Warrior": "Build and manage a diversified long-term portfolio.",
  "Smart Risk, Smart Profit": "Disciplined risk management for consistent results.",
  "Legacy & Wealth Psychology": "Wealth psychology and legacy planning.",
  "Wealth Her Way": "Financial empowerment tailored for women.",
  "Smart Mom, Smart Money": "Practical money skills for mothers and families.",
};

export default function CoursesPage() {
  return (
    <MarketingShell active="courses">
      <section className="mkt-section mkt-section--muted">
        <div className="mkt-container">
          <SectionHeading
            title="Our Courses"
            subtitle="Explore our comprehensive range of courses designed to help you master the art of investing and trading."
          />
          <CourseGrid descriptions={COURSE_PAGE_DESCRIPTIONS} />
        </div>
      </section>
    </MarketingShell>
  );
}
