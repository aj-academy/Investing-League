export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readMinutes: number;
  body: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "learn-finance-from-zero",
    title: "How to Learn Finance from Zero",
    excerpt:
      "A practical roadmap for beginners who want structured finance learning without hype or shortcuts.",
    date: "2026-05-15",
    readMinutes: 6,
    body: [
      "Starting finance learning can feel overwhelming. The key is to begin with money basics — saving, budgeting, and habits — before moving to markets.",
      "The Investing League recommends a step-by-step path: personal finance foundations, risk awareness, and only then market observation tools like Decision Lab for structured study.",
      "Avoid chasing tips or guaranteed-return promises. Education-first learning builds confidence that lasts.",
    ],
  },
  {
    slug: "trading-vs-investing-beginners",
    title: "Trading vs Investing: What Beginners Must Know",
    excerpt:
      "Understand the difference before you choose a learning path or tool.",
    date: "2026-05-08",
    readMinutes: 5,
    body: [
      "Investing often focuses on long-term wealth building. Trading involves shorter decision cycles and higher emotional discipline demands.",
      "Neither is a guaranteed path to profit. Both require education, risk awareness, and personal responsibility.",
      "Our courses and Decision Lab support learning — not investment advice or trade calls.",
    ],
  },
  {
    slug: "why-most-traders-lose",
    title: "Why Most Traders Lose Money",
    excerpt:
      "Common behavioural and risk mistakes — and how education addresses them.",
    date: "2026-04-28",
    readMinutes: 7,
    body: [
      "Many losses come from overtrading, poor risk control, and following tips without understanding context.",
      "Journaling and structured observation help learners see patterns in their own decisions.",
      "Discipline-based education focuses on process, not promised outcomes.",
    ],
  },
  {
    slug: "risk-management-trading",
    title: "What Is Risk Management in Trading?",
    excerpt:
      "Core concepts every market learner should understand before acting on any setup.",
    date: "2026-04-20",
    readMinutes: 6,
    body: [
      "Risk management means defining how much uncertainty you can accept before a decision — and sticking to it.",
      "Position sizing, stop discipline, and daily limits are educational topics in our risk-focused programs.",
      "Decision Lab supports risk-awareness views for learning; it does not replace your own judgment.",
    ],
  },
  {
    slug: "trading-journal-discipline",
    title: "How a Trading Journal Improves Discipline",
    excerpt:
      "Why recording observations and decisions builds better habits over time.",
    date: "2026-04-10",
    readMinutes: 5,
    body: [
      "A journal turns vague memories into reviewable data about your decisions and emotions.",
      "Members use Decision Lab journaling for educational review — not as proof of future results.",
      "Regular review helps learners spot repeated mistakes and improve decision quality.",
    ],
  },
  {
    slug: "students-personal-finance",
    title: "How Students Can Start Learning Personal Finance",
    excerpt:
      "Practical first steps for students and young earners in India.",
    date: "2026-03-25",
    readMinutes: 5,
    body: [
      "Students benefit from learning budgeting, saving, and goal-setting early.",
      "Our beginner courses focus on money confidence before advanced market topics.",
      "Finance education for students should be practical, affordable, and free of income hype.",
    ],
  },
  {
    slug: "blind-trading-signals-danger",
    title: "Why Blind Trading Signals Are Dangerous",
    excerpt:
      "The risks of following calls without education or risk context.",
    date: "2026-03-12",
    readMinutes: 6,
    body: [
      "Signal groups and tip channels often hide risk, sample size, and accountability.",
      "The Investing League does not provide trading calls or guaranteed setups.",
      "Educational observation teaches you to study context — not to copy entries blindly.",
    ],
  },
  {
    slug: "build-market-discipline",
    title: "How to Build Market Discipline Before Trading",
    excerpt:
      "A responsible sequence for learners who want structure before real decisions.",
    date: "2026-03-01",
    readMinutes: 6,
    body: [
      "Discipline comes from repeatable routines: observe, note risk, journal, review.",
      "Decision Lab is designed to support that learning loop for members.",
      "Build skills and self-awareness first; markets will always involve uncertainty.",
    ],
  },
];

export function getBlogPost(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
