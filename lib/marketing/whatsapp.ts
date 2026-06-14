export const WHATSAPP_NUMBER = "919445244572";

export const WHATSAPP_PRESETS = {
  course:
    "Hi, I am interested in The Investing League courses. Please share details.",
  scanner:
    "Hi, I am interested in Decision Lab scanner access. Please share plans and onboarding details.",
  bundle: "Hi, I want to know about the course + scanner bundle.",
  general: "Hi, I would like to connect with The Investing League team.",
} as const;

export function openWhatsAppPreset(
  preset: keyof typeof WHATSAPP_PRESETS
) {
  openWhatsApp(WHATSAPP_PRESETS[preset]);
}

export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(message: string) {
  window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
}

export function buildLeadInquiryMessage({
  name,
  email,
  phone,
  interest,
  message,
}: {
  name?: string;
  email?: string;
  phone?: string;
  interest?: string;
  message?: string;
}) {
  const lines = [
    "Hello The Investing League team,",
    "",
    "I would like more information.",
    "",
    `Name: ${name || "—"}`,
    `Email: ${email || "—"}`,
    `Contact: ${phone || "—"}`,
    `Interested in: ${interest || "—"}`,
  ];
  if (message?.trim()) {
    lines.push("", message.trim());
  }
  lines.push("", "Thank you.");
  return lines.join("\n");
}

export function buildSyllabusInquiryMessage({
  name,
  email,
  phone,
  course,
}: {
  name?: string;
  email?: string;
  phone?: string;
  course?: string;
}) {
  const lines = [
    "Hello The Investing League team,",
    "",
    "I would like the syllabus and enrollment details.",
    "",
    `Name: ${name || "—"}`,
    `Email: ${email || "—"}`,
  ];
  if (phone) lines.push(`Phone: ${phone}`);
  if (course) lines.push(`Interested course: ${course}`);
  lines.push("", "Thank you.");
  return lines.join("\n");
}

export function buildCourseInquiryMessage(courseName: string) {
  return [
    "Hello The Investing League team,",
    "",
    `I am interested in the course: ${courseName}.`,
    "",
    "Please share the syllabus, schedule, and enrollment details.",
    "",
    "Thank you.",
  ].join("\n");
}

export function buildGeneralContactMessage({
  name,
  email,
  phone,
  message,
}: {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}) {
  return [
    "Hello The Investing League team,",
    "",
    "I have a question / inquiry:",
    "",
    `Name: ${name || "—"}`,
    `Email: ${email || "—"}`,
    phone ? `Phone: ${phone}` : "",
    "",
    message || "—",
    "",
    "Thank you.",
  ]
    .filter(Boolean)
    .join("\n");
}
