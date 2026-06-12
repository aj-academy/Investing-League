/** Full Decision Lab app (scanner, journal, analytics). */
export const DECISION_LAB_URL =
  import.meta.env.VITE_DECISION_LAB_URL || "https://investing-league-seven.vercel.app";

export const DECISION_LAB_LOGIN_URL = `${DECISION_LAB_URL.replace(/\/$/, "")}/login`;

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
];
