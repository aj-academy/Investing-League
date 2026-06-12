"use client";

import { COURSE_OPTIONS } from "@/lib/marketing/courses";
import { buildSyllabusInquiryMessage, openWhatsApp } from "@/lib/marketing/whatsapp";

export function SyllabusForm({
  id = "cta-enroll",
  submitLabel = "Get syllabus on WhatsApp",
}: {
  id?: string;
  submitLabel?: string;
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value.trim();
    const course = (form.elements.namedItem("course") as HTMLSelectElement).value.trim();

    if (!name || !email) {
      alert("Please enter your name and email.");
      return;
    }

    openWhatsApp(buildSyllabusInquiryMessage({ name, email, phone, course }));
  };

  return (
    <form id={id} className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="syllabus-name" className="block text-sm font-medium text-gray-700 mb-1">
          Full name
        </label>
        <input
          type="text"
          id="syllabus-name"
          name="name"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
          placeholder="Your full name"
        />
      </div>
      <div>
        <label htmlFor="syllabus-email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          id="syllabus-email"
          name="email"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
          placeholder="Your email"
        />
      </div>
      <div>
        <label htmlFor="syllabus-phone" className="block text-sm font-medium text-gray-700 mb-1">
          WhatsApp / phone
        </label>
        <input
          type="tel"
          id="syllabus-phone"
          name="phone"
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
          placeholder="+91 …"
        />
      </div>
      <div>
        <label htmlFor="syllabus-course" className="block text-sm font-medium text-gray-700 mb-1">
          Interested course
        </label>
        <select
          id="syllabus-course"
          name="course"
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
          defaultValue=""
        >
          <option value="" disabled>Select a course</option>
          {COURSE_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="w-full bg-primary text-white py-3 rounded font-medium hover:bg-primary/90"
      >
        {submitLabel}
      </button>
      <p className="text-xs text-gray-500 text-center">
        Opens WhatsApp with your details — no server signup required.
      </p>
    </form>
  );
}
