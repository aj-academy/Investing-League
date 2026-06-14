export const SITE_TAGLINE = "Learn finance. Build discipline. Use data before decisions.";

export const EDUCATION_DISCLAIMER =
  "The Investing League provides education and learning-based tools only. We do not provide investment advice, stock recommendations, or profit guarantees.";

export const SCANNER_DISCLAIMER =
  "Decision Lab is for educational market analysis, signal testing, and journaling only. It does not provide financial advice, investment recommendations, or guaranteed profit.";

export const CONTACT_INFO = {
  location: "Chennai, Tamil Nadu, India",
  email: "info@investingleague.info",
  phone: "+91 93614 89738",
} as const;

export type NavKey =
  | "home"
  | "courses"
  | "decision-lab"
  | "plans"
  | "about"
  | "contact";

export const NAV_LINKS: { key: NavKey; label: string; href: string }[] = [
  { key: "home", label: "Home", href: "/" },
  { key: "courses", label: "Courses", href: "/courses" },
  { key: "decision-lab", label: "Decision Lab", href: "/decision-lab" },
  { key: "plans", label: "Plans", href: "/plans" },
  { key: "about", label: "About", href: "/about" },
  { key: "contact", label: "Contact", href: "/contact" },
];

export type CourseCategory =
  | "Beginner"
  | "Wealth Building"
  | "Trading Foundation"
  | "Risk Management"
  | "Women & Family Finance"
  | "Advanced Market Learning";

export const COURSE_CATEGORIES: CourseCategory[] = [
  "Beginner",
  "Wealth Building",
  "Trading Foundation",
  "Risk Management",
  "Women & Family Finance",
  "Advanced Market Learning",
];

export type CourseRecord = {
  slug: string;
  name: string;
  image: string;
  category: CourseCategory;
  level: string;
  weeks: string;
  bestFor: string;
  description: string;
  outcome: string;
  whoFor: string[];
  learnItems: string[];
  modules: string[];
  faqs: { question: string; answer: string }[];
};

export const COURSES: CourseRecord[] = [
  {
    slug: "money-made-simple",
    name: "Money Made Simple",
    image: "/C-1.png",
    category: "Beginner",
    level: "Beginner",
    weeks: "6 weeks",
    bestFor: "Complete beginners",
    description:
      "Understand money, saving, budgeting, and financial habits in a simple, practical way.",
    outcome: "Build basic confidence in personal finance decisions.",
    whoFor: [
      "Students and first-time earners",
      "Anyone overwhelmed by money basics",
      "Families starting their financial journey",
    ],
    learnItems: [
      "How money works in daily life",
      "Saving and budgeting frameworks",
      "Debt awareness and smart spending",
      "Building healthy money habits",
    ],
    modules: [
      "Money mindset basics",
      "Budgeting that sticks",
      "Saving systems",
      "Debt and discipline",
      "Planning for goals",
      "Next steps in your learning path",
    ],
    faqs: [
      {
        question: "Do I need prior finance knowledge?",
        answer: "No. This course is designed for complete beginners.",
      },
      {
        question: "Is this investment advice?",
        answer: "No. This is educational content to build personal finance confidence.",
      },
    ],
  },
  {
    slug: "foundation-of-wealth",
    name: "Foundation of Wealth",
    image: "/C-2.png",
    category: "Wealth Building",
    level: "Intermediate",
    weeks: "8 weeks",
    bestFor: "Early wealth builders",
    description:
      "Learn how wealth is built through discipline, allocation, and long-term planning.",
    outcome: "Understand the core principles behind sustainable wealth creation.",
    whoFor: [
      "Young professionals",
      "Beginners ready for structured wealth concepts",
      "Learners moving beyond basic budgeting",
    ],
    learnItems: [
      "Wealth-building fundamentals",
      "Asset classes at a learning level",
      "Goal-based financial planning",
      "Habits that support long-term growth",
    ],
    modules: [
      "What wealth really means",
      "Income vs. assets",
      "Planning horizons",
      "Risk awareness intro",
      "Portfolio thinking (educational)",
      "Wealth habits and review",
    ],
    faqs: [
      {
        question: "Will this teach me to pick stocks?",
        answer: "This course focuses on wealth foundations, not stock recommendations.",
      },
    ],
  },
  {
    slug: "the-wealth-builder",
    name: "The Wealth Builder",
    image: "/C-3.png",
    category: "Wealth Building",
    level: "Advanced",
    weeks: "10 weeks",
    bestFor: "Committed wealth learners",
    description:
      "Go deeper into wealth strategies, asset thinking, and disciplined execution.",
    outcome: "Develop a structured approach to building and protecting wealth.",
    whoFor: [
      "Professionals with savings to manage",
      "Learners who completed foundation programs",
      "Entrepreneurs planning long-term wealth",
    ],
    learnItems: [
      "Advanced wealth frameworks",
      "Asset allocation concepts",
      "Tax and structure awareness (educational)",
      "Review and refinement habits",
    ],
    modules: [
      "Wealth builder mindset",
      "Multi-asset overview",
      "Cash flow and capital",
      "Protection and diversification",
      "Execution discipline",
      "Long-term review systems",
    ],
    faqs: [
      {
        question: "Is there a certificate?",
        answer: "Certificate details are shared during enrollment enquiry.",
      },
    ],
  },
  {
    slug: "income-accelerator",
    name: "Income Accelerator",
    image: "/C-4.png",
    category: "Wealth Building",
    level: "Intermediate",
    weeks: "7 weeks",
    bestFor: "Income-focused learners",
    description:
      "Explore ways to grow income through skills, side paths, and financial leverage — educationally.",
    outcome: "Identify practical income growth opportunities aligned with your skills.",
    whoFor: [
      "Working professionals",
      "Freelancers and side-hustle curious learners",
      "Anyone seeking income diversification ideas",
    ],
    learnItems: [
      "Income streams overview",
      "Skill-to-income mapping",
      "Financial leverage concepts",
      "Risk-aware opportunity evaluation",
    ],
    modules: [
      "Income audit",
      "Skill monetization",
      "Side income paths",
      "Leverage basics",
      "Risk filters",
      "Action planning",
    ],
    faqs: [
      {
        question: "Does this guarantee higher income?",
        answer: "No. We teach frameworks for exploration — outcomes depend on your effort.",
      },
    ],
  },
  {
    slug: "market-warrior",
    name: "Market Warrior",
    image: "/c-5 .png",
    category: "Trading Foundation",
    level: "Intermediate",
    weeks: "8 weeks",
    bestFor: "Aspiring market learners",
    description:
      "Build trading foundations with charts, market structure, and disciplined observation habits.",
    outcome: "Gain confidence in reading markets for learning — not as advice.",
    whoFor: [
      "Beginners entering market learning",
      "Course graduates wanting market exposure",
      "Learners focused on discipline",
    ],
    learnItems: [
      "Market structure basics",
      "Chart reading fundamentals",
      "Observation and journaling",
      "Discipline in decision-making",
    ],
    modules: [
      "Markets overview",
      "Charts and patterns (educational)",
      "Session routines",
      "Journaling practice",
      "Risk awareness",
      "Learning roadmap",
    ],
    faqs: [
      {
        question: "Will I get trade calls?",
        answer: "No. This is educational market learning, not buy/sell recommendations.",
      },
    ],
  },
  {
    slug: "smart-risk-smart-profit",
    name: "Smart Risk, Smart Profit",
    image: "/c-6.png",
    category: "Risk Management",
    level: "Advanced",
    weeks: "12 weeks",
    bestFor: "Active learners and traders",
    description:
      "Master risk frameworks, position sizing concepts, and disciplined decision habits.",
    outcome: "Apply risk-aware thinking before any market decision.",
    whoFor: [
      "Traders building discipline",
      "Learners who understand market basics",
      "Anyone who wants structured risk habits",
    ],
    learnItems: [
      "Risk-per-trade concepts",
      "Position sizing (educational)",
      "Drawdown awareness",
      "Decision checklists",
    ],
    modules: [
      "Risk philosophy",
      "Sizing frameworks",
      "Scenario thinking",
      "Journal integration",
      "Emotional discipline",
      "Review cadence",
    ],
    faqs: [
      {
        question: "Is profit guaranteed with these methods?",
        answer: "No. We teach risk awareness — there are no profit guarantees.",
      },
    ],
  },
  {
    slug: "legacy-wealth-psychology",
    name: "Legacy & Wealth Psychology",
    image: "/c-7.png",
    category: "Advanced Market Learning",
    level: "Advanced",
    weeks: "12 weeks",
    bestFor: "Long-term thinkers",
    description:
      "Explore wealth psychology, legacy planning, and mindset for lasting financial decisions.",
    outcome: "Align money decisions with values and long-term family goals.",
    whoFor: [
      "Established earners",
      "Family planners",
      "Learners focused on mindset and legacy",
    ],
    learnItems: [
      "Money psychology patterns",
      "Legacy and estate awareness",
      "Family finance conversations",
      "Long-horizon decision making",
    ],
    modules: [
      "Psychology of wealth",
      "Beliefs and behavior",
      "Legacy frameworks",
      "Family planning talks",
      "Generational thinking",
      "Personal action plan",
    ],
    faqs: [
      {
        question: "Is this therapy or coaching?",
        answer: "This is educational content on psychology and planning — not clinical therapy.",
      },
    ],
  },
  {
    slug: "wealth-her-way",
    name: "Wealth Her Way",
    image: "/c-8.png",
    category: "Women & Family Finance",
    level: "Advanced",
    weeks: "12 weeks",
    bestFor: "Women building financial independence",
    description:
      "Financial empowerment tailored for women — confidence, planning, and wealth habits.",
    outcome: "Build independent financial confidence and a personal wealth roadmap.",
    whoFor: [
      "Working women",
      "Entrepreneurs",
      "Women returning to workforce or investing learning",
    ],
    learnItems: [
      "Financial confidence building",
      "Income and savings strategies",
      "Investment learning paths",
      "Community and accountability",
    ],
    modules: [
      "Starting where you are",
      "Confidence and clarity",
      "Income and protection",
      "Learning markets safely",
      "Wealth habits",
      "Your roadmap",
    ],
    faqs: [
      {
        question: "Is this only for women?",
        answer: "The content is designed for women learners; all are welcome to enquire.",
      },
    ],
  },
  {
    slug: "smart-mom-smart-money",
    name: "Smart Mom, Smart Money",
    image: "/C-9.png",
    category: "Women & Family Finance",
    level: "Advanced",
    weeks: "12 weeks",
    bestFor: "Mothers and family finance leaders",
    description:
      "Practical money skills for mothers — family budgets, goals, and teaching kids about money.",
    outcome: "Run family finances with clarity and teach healthy money habits at home.",
    whoFor: [
      "Mothers managing household finances",
      "Parents teaching kids about money",
      "Family budget owners",
    ],
    learnItems: [
      "Family budgeting systems",
      "Kids and money education",
      "Emergency and goal planning",
      "Balancing family and personal goals",
    ],
    modules: [
      "Family money map",
      "Budgets that work at home",
      "Teaching children",
      "Goals and emergencies",
      "Self-care and finance",
      "Family action plan",
    ],
    faqs: [
      {
        question: "Can dads enroll?",
        answer: "Yes — the content focuses on family finance skills useful for any parent.",
      },
    ],
  },
];

export const POPULAR_COURSE_SLUGS = [
  "money-made-simple",
  "foundation-of-wealth",
  "market-warrior",
  "smart-risk-smart-profit",
  "wealth-her-way",
  "smart-mom-smart-money",
] as const;

export function getCourseBySlug(slug: string): CourseRecord | undefined {
  return COURSES.find((c) => c.slug === slug);
}

export const WHO_WE_HELP = [
  { title: "Students", desc: "Build money basics early with structured learning." },
  { title: "Beginners", desc: "Start from zero with clear, practical modules." },
  { title: "Working Professionals", desc: "Grow wealth habits alongside your career." },
  { title: "Traders", desc: "Sharpen discipline and risk-aware market observation." },
  { title: "Women & Family Finance Learners", desc: "Tailored paths for independence and family goals." },
  { title: "Entrepreneurs", desc: "Connect business income to personal wealth learning." },
] as const;

export const DECISION_LAB_FEATURES = [
  { title: "Market observation", desc: "Educational dashboard to observe market conditions." },
  { title: "Signal testing", desc: "Test signal discipline in a learning environment." },
  { title: "Risk awareness", desc: "Built-in reminders that this is not advice." },
  { title: "Trade journaling", desc: "Track decisions and build review habits." },
  { title: "Learning discipline", desc: "Structured access that supports habit-building." },
  { title: "Protected member access", desc: "Secure login for enrolled scanner members." },
] as const;

export const WHY_CHOOSE = [
  { title: "Practical finance learning", desc: "Skills you can apply immediately in daily decisions." },
  { title: "Beginner-friendly structure", desc: "Clear paths from basics to advanced topics." },
  { title: "Education-first approach", desc: "No hype — learning and discipline at the center." },
  { title: "Risk-aware market learning", desc: "Markets taught with awareness, not promises." },
  { title: "Course + scanner ecosystem", desc: "Courses and Decision Lab support the same habits." },
  { title: "WhatsApp-based support", desc: "Easy enquiry and onboarding through WhatsApp." },
] as const;

export const TESTIMONIALS = [
  {
    name: "Priya S.",
    role: "Student",
    quote:
      "The structured courses helped me understand money without feeling overwhelmed. Clear, practical, and trustworthy.",
  },
  {
    name: "Arun K.",
    role: "Working professional",
    quote:
      "Decision Lab changed how I observe markets — I focus on discipline and journaling, not chasing tips.",
  },
  {
    name: "Meera R.",
    role: "Parent learner",
    quote:
      "Smart Mom, Smart Money gave our family a shared language for budgeting and goals.",
  },
] as const;

export const WORKSHOP_HIGHLIGHTS = [
  "Live learning sessions with practical exercises",
  "Community Q&A and peer support",
  "Certificate-oriented program milestones",
  "Hands-on market observation workshops",
] as const;

export type PlanRecord = {
  id: string;
  name: string;
  purpose: string;
  includes: string[];
  cta: string;
  interest: string;
};

export const PLANS: PlanRecord[] = [
  {
    id: "learning-starter",
    name: "Learning Starter",
    purpose: "For beginners starting finance learning",
    includes: [
      "Beginner course access / enquiry",
      "WhatsApp support and enquiry",
      "Personalized learning roadmap guidance",
    ],
    cta: "Enquire Now",
    interest: "Course (general enquiry)",
  },
  {
    id: "decision-lab",
    name: "Decision Lab Access",
    purpose: "For users who want scanner access for educational market observation",
    includes: [
      "Scanner member access",
      "Market observation dashboard",
      "Signal testing support",
      "Risk-awareness disclaimer and onboarding",
    ],
    cta: "Request Access",
    interest: "Decision Lab Scanner",
  },
  {
    id: "bundle",
    name: "Course + Scanner Bundle",
    purpose: "For learners who want structured training plus scanner access",
    includes: [
      "Course guidance and enrollment support",
      "Decision Lab access",
      "Practical learning support",
      "WhatsApp onboarding",
    ],
    cta: "Talk to Us",
    interest: "Course + Scanner Bundle",
  },
];

export const DECISION_LAB_FAQS = [
  {
    question: "What is Decision Lab?",
    answer:
      "An educational market scanner for observation, signal testing, and journaling — built for learning, not profit guarantees.",
  },
  {
    question: "Who should use it?",
    answer:
      "Learners and members who want structured market observation as part of their education journey.",
  },
  {
    question: "Does it give investment advice?",
    answer: "No. It is a decision-support learning tool, not investment advice or recommendations.",
  },
  {
    question: "How do I get access?",
    answer: "Enquire via WhatsApp or view plans — our team will guide onboarding for eligible members.",
  },
] as const;
