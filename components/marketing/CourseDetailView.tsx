import type { CourseRecord } from "@/lib/marketing/siteData";
import { CourseLearnButton } from "./CourseLearnButton";
import { MarketingShell } from "./MarketingShell";
import { CTAButton } from "./ui/CTAButton";
import { FAQAccordion } from "./ui/FAQAccordion";
import { SectionHeader } from "./ui/SectionHeader";

export function CourseDetailView({ course }: { course: CourseRecord }) {
  return (
    <MarketingShell active="courses">
      <section className="mkt-hero mkt-hero--compact">
        <div className="mkt-container">
          <div className="mkt-hero-grid">
            <div className="mkt-hero-content">
              <p className="mkt-hero-eyebrow">{course.category} · {course.weeks}</p>
              <h1 className="mkt-hero-title">{course.name}</h1>
              <p className="mkt-hero-lead">{course.description}</p>
              <p className="mkt-course-outcome mkt-course-outcome--hero">
                <strong>Outcome:</strong> {course.outcome}
              </p>
              <div className="mkt-hero-actions">
                <CourseLearnButton
                  courseName={course.name}
                  className="mkt-btn mkt-btn-gold mkt-btn-lg"
                />
                <CTAButton href="/courses" variant="outline">All Courses</CTAButton>
              </div>
            </div>
            <div className="mkt-hero-media">
              <img src={course.image} alt="" />
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container mkt-prose-narrow">
          <SectionHeader title="Who This Course Is For" align="left" />
          <ul className="mkt-check-list">
            {course.whoFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-container mkt-prose-narrow">
          <SectionHeader title="What You Will Learn" align="left" />
          <ul className="mkt-check-list">
            {course.learnItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container mkt-prose-narrow">
          <SectionHeader title="Course Outcomes" align="left" />
          <p className="mkt-muted-text">{course.outcome}</p>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-container mkt-prose-narrow">
          <SectionHeader title="Modules" align="left" />
          <ol className="mkt-module-list">
            {course.modules.map((mod, i) => (
              <li key={mod}>
                <span className="mkt-module-num">{i + 1}</span>
                {mod}
              </li>
            ))}
          </ol>
          <div className="mkt-placeholder-row">
            <div className="mkt-placeholder-card">
              <strong>Mode</strong>
              <p>Live / hybrid — details on enquiry</p>
            </div>
            <div className="mkt-placeholder-card">
              <strong>Duration</strong>
              <p>{course.weeks}</p>
            </div>
            <div className="mkt-placeholder-card">
              <strong>Certificate</strong>
              <p>Details shared during enrollment</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container mkt-prose-narrow">
          <SectionHeader title="FAQ" align="left" />
          <FAQAccordion items={course.faqs} />
        </div>
      </section>

      <section className="mkt-section mkt-final-cta">
        <div className="mkt-container mkt-final-cta-inner">
          <h2>Enquire about {course.name}</h2>
          <p className="mkt-muted-text">
            WhatsApp us for syllabus, schedule, and enrollment — no payment required to enquire.
          </p>
          <CourseLearnButton
            courseName={course.name}
            className="mkt-btn mkt-btn-gold mkt-btn-lg"
          />
        </div>
      </section>
    </MarketingShell>
  );
}
