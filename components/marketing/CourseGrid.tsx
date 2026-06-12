import { COURSE_CARDS } from "@/lib/marketing/courses";
import { CourseLearnButton } from "./CourseLearnButton";

function levelBadgeClass(level: string) {
  if (level === "Beginner") return "mkt-badge mkt-badge--green";
  if (level === "Intermediate") return "mkt-badge mkt-badge--amber";
  return "mkt-badge mkt-badge--red";
}

export function CourseGrid({ descriptions }: { descriptions?: Record<string, string> }) {
  return (
    <div className="mkt-course-grid">
      {COURSE_CARDS.map((course) => (
        <article key={course.name} className="mkt-course-card">
          <div className="mkt-course-card-image">
            <img src={course.image} alt={course.name} />
          </div>
          <div className="mkt-course-card-body">
            <div className="mkt-course-card-meta">
              <span className={levelBadgeClass(course.level)}>{course.level}</span>
              <span className="mkt-course-weeks">{course.weeks}</span>
            </div>
            <h3 className="mkt-course-card-title">{course.name}</h3>
            {descriptions?.[course.name] && (
              <p className="mkt-course-card-desc">{descriptions[course.name]}</p>
            )}
            <div className="mkt-course-card-actions">
              <CourseLearnButton courseName={course.name} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
