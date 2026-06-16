import { COURSES } from "./siteData";

export const COURSE_OPTIONS = COURSES.map((c) => c.name) as [
  string,
  ...string[],
];

export const SCANNER_INTEREST = "Decision Lab";

export const GENERAL_INTEREST_OPTIONS = [
  "Course",
  SCANNER_INTEREST,
  "Course + Bundle",
  "Mentor Call",
] as const;

export const EXPERIENCE_LEVELS = [
  "Beginner",
  "Student",
  "Working Professional",
  "Trader",
] as const;

export const INTEREST_OPTIONS = [
  ...GENERAL_INTEREST_OPTIONS,
  ...COURSE_OPTIONS,
] as const;

export const COURSE_CARDS = COURSES.map((c) => ({
  name: c.name,
  image: c.image,
  level: c.level,
  weeks: c.weeks,
  slug: c.slug,
}));
