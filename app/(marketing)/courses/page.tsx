import type { Metadata } from "next";
import { CourseGrid } from "@/components/marketing/CourseGrid";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Courses — The Investing League",
  description: "Explore our range of investing and trading courses. Request syllabus on WhatsApp.",
};

const COURSE_PAGE_DESCRIPTIONS: Record<string, string> = {
  "Money Made Simple": "Master your money, one step at a time",
  "Foundation of Wealth":
    "Master chart patterns, indicators, and technical trading strategies to make data-driven investment decisions.",
  "The Wealth Builder":
    "Learn advanced options strategies, risk management techniques, and how to generate income in any market condition.",
  "Income Accelerator":
    "Learn how to analyze financial statements, value companies, and identify undervalued investment opportunities.",
  "Market Warrior":
    "Master the art of building and managing a diversified investment portfolio for long-term wealth creation.",
  "Smart Risk, Smart Profit":
    "Learn how to develop, test, and implement automated trading strategies using programming and APIs.",
  "Legacy & Wealth Psychology":
    "Understand wealth psychology and legacy planning for long-term financial success.",
  "Wealth Her Way": "Financial empowerment tailored for women building independent wealth.",
  "Smart Mom, Smart Money": "Practical money skills for mothers managing family and future goals.",
};

export default function CoursesPage() {
  return (
    <MarketingShell active="courses">
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Courses</h1>
            <div className="w-20 h-1 bg-primary mx-auto mb-8" />
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Explore our comprehensive range of courses designed to help you master the art of
              investing and trading.
            </p>
          </div>
          <CourseGrid descriptions={COURSE_PAGE_DESCRIPTIONS} />
        </div>
      </section>
    </MarketingShell>
  );
}
