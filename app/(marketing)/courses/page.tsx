import type { Metadata } from "next";
import { CoursesListing } from "@/components/marketing/CoursesListing";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Finance Courses | The Investing League",
  description:
    "Explore practical finance, investing, wealth-building, and market learning courses for beginners and professionals.",
};

export default function CoursesPage() {
  return (
    <MarketingShell active="courses">
      <section className="mkt-section">
        <div className="mkt-container">
          <CoursesListing />
        </div>
      </section>
    </MarketingShell>
  );
}
