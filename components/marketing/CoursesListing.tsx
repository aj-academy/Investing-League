"use client";

import { useMemo, useState } from "react";
import {
  COURSE_CATEGORIES,
  COURSES,
  type CourseCategory,
} from "@/lib/marketing/siteData";
import { CourseCard } from "./ui/CourseCard";
import { SectionHeader } from "./ui/SectionHeader";

export function CoursesListing() {
  const [activeCategory, setActiveCategory] = useState<CourseCategory | "All">(
    "All"
  );

  const filtered = useMemo(() => {
    if (activeCategory === "All") return COURSES;
    return COURSES.filter((c) => c.category === activeCategory);
  }, [activeCategory]);

  return (
    <>
      <SectionHeader
        title="Finance Courses Built for Practical Learning"
        subtitle="Choose a program based on your current level, learning goal, and career or wealth-building interest."
      />

      <div className="mkt-filter-bar" role="tablist" aria-label="Course categories">
        <button
          type="button"
          className={`mkt-filter-pill${activeCategory === "All" ? " is-active" : ""}`}
          onClick={() => setActiveCategory("All")}
        >
          All
        </button>
        {COURSE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`mkt-filter-pill${activeCategory === cat ? " is-active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mkt-course-grid">
        {filtered.map((course) => (
          <CourseCard key={course.slug} course={course} />
        ))}
      </div>
    </>
  );
}
