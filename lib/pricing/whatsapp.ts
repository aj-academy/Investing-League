/** India WhatsApp business number (without +). */
export const WHATSAPP_CONTACT_NUMBER = "919445244572";

export function buildPlanInquiryWhatsAppUrl(planName: string, priceLabel: string) {
  const message = [
    "Hello The Investing League team,",
    "",
    `I am interested in enrolling in the ${planName} plan (${priceLabel}).`,
    "",
    "Please share the payment details and next steps to activate my account.",
    "",
    "Thank you.",
  ].join("\n");

  return `https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=${encodeURIComponent(message)}`;
}
