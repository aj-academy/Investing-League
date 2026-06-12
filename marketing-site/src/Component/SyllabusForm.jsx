import { COURSE_OPTIONS } from "../lib/config";
import { buildSyllabusInquiryMessage, openWhatsApp } from "../lib/whatsapp";

export function SyllabusForm({ id = "cta-enroll", showPhone = true, submitLabel = "Get syllabus on WhatsApp" }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = form.elements.namedItem("name")?.value?.trim();
    const email = form.elements.namedItem("email")?.value?.trim();
    const phone = form.elements.namedItem("phone")?.value?.trim();
    const course = form.elements.namedItem("course")?.value?.trim();

    if (!name || !email) {
      alert("Please enter your name and email.");
      return;
    }

    openWhatsApp(
      buildSyllabusInquiryMessage({ name, email, phone, course })
    );
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
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
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
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
          placeholder="Your email"
        />
      </div>
      {showPhone && (
        <div>
          <label htmlFor="syllabus-phone" className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp / phone
          </label>
          <input
            type="tel"
            id="syllabus-phone"
            name="phone"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
            placeholder="+91 …"
          />
        </div>
      )}
      <div>
        <label htmlFor="syllabus-course" className="block text-sm font-medium text-gray-700 mb-1">
          Interested course
        </label>
        <select
          id="syllabus-course"
          name="course"
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
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
        className="w-full bg-primary text-white py-3 !rounded-button whitespace-nowrap hover:bg-primary/90 font-medium flex items-center justify-center gap-2"
      >
        <i className="ri-whatsapp-line text-lg" />
        {submitLabel}
      </button>
      <p className="text-xs text-gray-500 text-center">
        Opens WhatsApp with your details — no account or server signup required.
      </p>
    </form>
  );
}
