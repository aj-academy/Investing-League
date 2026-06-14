import Link from "next/link";
import type { CourseRecord } from "@/lib/marketing/siteData";
import { CourseLearnButton } from "../CourseLearnButton";

export function CourseCard({
  course,
  showImage = true,
}: {
  course: CourseRecord;
  showImage?: boolean;
}) {
  return (
    <article className="mkt-course-card">
      {showImage && (
        <div className="mkt-course-card-image">
          <img src={course.image} alt="" />
        </div>
      )}
      <div className="mkt-course-card-body">
        <div className="mkt-course-card-meta">
          <span className="mkt-badge mkt-badge--gold">{course.bestFor}</span>
          <span className="mkt-course-weeks">{course.weeks}</span>
        </div>
        <h3 className="mkt-course-card-title">{course.name}</h3>
        <p className="mkt-course-card-desc">{course.description}</p>
        <p className="mkt-course-outcome">
          <strong>Outcome:</strong> {course.outcome}
        </p>
        <div className="mkt-course-card-actions mkt-course-card-actions--split">
          <CourseLearnButton courseName={course.name} />
          <Link
            href={`/courses/${course.slug}`}
            className="mkt-link-secondary"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
