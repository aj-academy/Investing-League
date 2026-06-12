/** India WhatsApp number (no + prefix). */
export const WHATSAPP_NUMBER = "919445244572";

export function buildWhatsAppUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(message) {
  window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
}

export function buildSyllabusInquiryMessage({ name, email, phone, course }) {
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

export function buildCourseInquiryMessage(courseName) {
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

export function buildGeneralContactMessage({ name, email, phone, message }) {
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
