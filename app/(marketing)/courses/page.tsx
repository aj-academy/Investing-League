import type { Metadata } from "next";
import { CoursesListing } from "@/components/marketing/CoursesListing";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PAGE_SEO } from "@/lib/marketing/seo";

export const metadata: Metadata = {
  title: PAGE_SEO.courses.title,
  description: PAGE_SEO.courses.description,
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
