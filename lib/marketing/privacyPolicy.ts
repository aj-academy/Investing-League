import { CONTACT_INFO, EDUCATION_DISCLAIMER, SCANNER_DISCLAIMER } from "./siteData";

export const PRIVACY_POLICY_EFFECTIVE_DATE = "June 11, 2026";

export const PRIVACY_POLICY_SECTIONS = [
  {
    id: "who-we-are",
    title: "1. Who We Are",
    paragraphs: [
      `The Investing League ("we", "our", or "us") is an education-first finance learning and market decision platform based in ${CONTACT_INFO.location}. We provide practical finance courses, learning support, and access to Decision Lab — an educational market scanner for observation, signal testing, and trade journaling.`,
      "We are not a broker, investment adviser, or portfolio manager. Our services are designed for learning and disciplined decision support only.",
    ],
  },
  {
    id: "scope",
    title: "2. Scope of This Policy",
    paragraphs: [
      "This Privacy Policy applies when you visit our website, enquire about courses or plans, contact us via WhatsApp or email, enroll in programs, or use member login to access Decision Lab (the educational scanner), journal, analytics, and related learning tools.",
      "It covers personal information collected online and through offline workshops or class registrations coordinated by our team.",
    ],
  },
  {
    id: "information-collected",
    title: "3. Information We Collect",
    bullets: [
      "Identity & contact: name, email address, phone number, and messages you send when enquiring via our forms or WhatsApp.",
      "Course & enrollment: programs you are interested in, enrollment details, learning progress, and attendance where applicable.",
      "Decision Lab / scanner account: login credentials managed through our authentication provider, account email, plan or access level, scanner usage (such as scan activity, settings, and feature usage), journal entries you save, and analytics derived from your learning activity on the platform.",
      "Technical data: IP address, device and browser type, session cookies required for login, and general site usage needed to operate and secure the service.",
      "Payment information: if you pay for courses or scanner access, payment is processed by third-party providers. We do not store full card details on our servers.",
      "Communications: records of support or onboarding conversations when you contact us for help.",
    ],
  },
  {
    id: "how-we-use",
    title: "4. How We Use Your Information",
    bullets: [
      "Provide course information, enrollment support, and WhatsApp-based onboarding.",
      "Create and manage member accounts for Decision Lab scanner access.",
      "Operate the educational scanner, journaling, and analytics features for your learning use.",
      "Send service-related messages (access, account, or program updates). Marketing messages only where permitted and with opt-out where applicable.",
      "Improve platform performance, security, and educational content.",
      "Meet legal, regulatory, and contractual obligations.",
    ],
  },
  {
    id: "decision-lab",
    title: "5. Decision Lab Scanner — Important Information",
    paragraphs: [
      "Decision Lab is an educational market observation and decision-support tool. It is built for learning, signal testing discipline, and trade journaling — not for investment advice, stock recommendations, or guaranteed profit.",
      SCANNER_DISCLAIMER,
      "When you use Decision Lab as a member, we process account and usage data solely to provide protected access, maintain your journal and settings, enforce plan limits, and keep the platform secure. Scanner outputs are for educational observation only. We do not use your journal or scan activity to provide personalised investment advice.",
      "You are responsible for your own decisions in real markets. Data you enter in the journal or export is under your control; you may request deletion subject to legal retention requirements.",
    ],
  },
  {
    id: "sharing",
    title: "6. Data Sharing and Disclosure",
    bullets: [
      "We do not sell, rent, or trade your personal information.",
      "We use trusted service providers (such as hosting, authentication, database, email, and payment processors) who process data only to operate our services under confidentiality obligations.",
      "We may disclose information if required by law, court order, or to protect the rights, safety, and security of users and the platform.",
    ],
  },
  {
    id: "cookies",
    title: "7. Cookies and Similar Technologies",
    paragraphs: [
      "We use essential cookies and similar technologies to keep you signed in, protect accounts, and run Decision Lab securely. Optional analytics may be used to understand general site usage. You can control non-essential cookies through your browser settings; disabling essential cookies may limit login and scanner access.",
    ],
  },
  {
    id: "security",
    title: "8. Data Security",
    paragraphs: [
      "We apply reasonable technical and organisational measures (including encrypted connections, access controls, and secure hosting) to protect your data. No online system is completely risk-free; please use strong passwords and do not share your login credentials.",
    ],
  },
  {
    id: "retention",
    title: "9. Data Retention",
    paragraphs: [
      "We retain personal data for as long as needed to provide services, comply with law, resolve disputes, and enforce agreements. Account and journal data for Decision Lab members is retained while your account is active and for a limited period after closure where required for legal or security purposes.",
    ],
  },
  {
    id: "your-rights",
    title: "10. Your Rights",
    paragraphs: [
      `Depending on applicable law, you may request access, correction, or deletion of your personal data, or object to certain processing. Contact us at ${CONTACT_INFO.email} with your request. We will respond within a reasonable timeframe.`,
    ],
  },
  {
    id: "updates",
    title: "11. Updates to This Policy",
    paragraphs: [
      "We may update this Privacy Policy as our courses, Decision Lab features, or legal requirements change. The effective date at the top will be revised when updates are posted. Continued use of the website or scanner after changes constitutes acceptance of the updated policy.",
    ],
  },
  {
    id: "contact",
    title: "12. Contact Us",
    paragraphs: [
      `The Investing League`,
      `${CONTACT_INFO.location}`,
      `Email: ${CONTACT_INFO.email}`,
      `Phone: ${CONTACT_INFO.phone}`,
      EDUCATION_DISCLAIMER,
    ],
  },
] as const;
