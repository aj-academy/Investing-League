"use client";

import { buildGeneralContactMessage, openWhatsApp } from "@/lib/marketing/whatsapp";

export function ContactForm() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value.trim();
    const message = (form.elements.namedItem("message") as HTMLInputElement).value.trim();

    if (!name || !email || !message) {
      alert("Please enter your name, email, and message.");
      return;
    }

    openWhatsApp(buildGeneralContactMessage({ name, email, phone, message }));
  };

  return (
    <form className="space-y-4 max-w-lg" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">
          Full name
        </label>
        <input
          type="text"
          id="contact-name"
          name="name"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          id="contact-email"
          name="email"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
        />
      </div>
      <div>
        <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone / WhatsApp
        </label>
        <input
          type="tel"
          id="contact-phone"
          name="phone"
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
          placeholder="How can we help you?"
        />
      </div>
      <button
        type="submit"
        className="bg-primary text-white px-6 py-3 rounded font-medium hover:bg-primary/90"
      >
        Send on WhatsApp
      </button>
    </form>
  );
}
