export const COURSE_OPTIONS = [
  "Money Made Simple",
  "Foundation of Wealth",
  "The Wealth Builder",
  "Income Accelerator",
  "Market Warrior",
  "Smart Risk, Smart Profit",
  "Legacy & Wealth Psychology",
  "Wealth Her Way",
  "Smart Mom, Smart Money",
] as const;

export const SCANNER_INTEREST = "V8 Market Scanner";

export const INTEREST_OPTIONS = [...COURSE_OPTIONS, SCANNER_INTEREST] as const;

export const COURSE_CARDS = [
  { name: "Money Made Simple", image: "/C-1.png", level: "Beginner", weeks: "6 weeks" },
  { name: "Foundation of Wealth", image: "/C-2.png", level: "Intermediate", weeks: "8 weeks" },
  { name: "The Wealth Builder", image: "/C-3.png", level: "Advanced", weeks: "10 weeks" },
  { name: "Income Accelerator", image: "/C-4.png", level: "Intermediate", weeks: "7 weeks" },
  { name: "Market Warrior", image: "/c-5 .png", level: "Intermediate", weeks: "8 weeks" },
  { name: "Smart Risk, Smart Profit", image: "/c-6.png", level: "Advanced", weeks: "12 weeks" },
  { name: "Legacy & Wealth Psychology", image: "/c-7.png", level: "Advanced", weeks: "12 weeks" },
  { name: "Wealth Her Way", image: "/c-8.png", level: "Advanced", weeks: "12 weeks" },
  { name: "Smart Mom, Smart Money", image: "/C-9.png", level: "Advanced", weeks: "12 weeks" },
] as const;
