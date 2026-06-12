import { buildCourseInquiryMessage, openWhatsApp } from "../lib/whatsapp";

export function CourseLearnButton({ courseName, className = "" }) {
  return (
    <button
      type="button"
      className={
        className ||
        "bg-primary text-white px-4 py-2 !rounded-button whitespace-nowrap hover:bg-primary/90 w-full"
      }
      onClick={() => openWhatsApp(buildCourseInquiryMessage(courseName))}
    >
      Syllabus on WhatsApp
    </button>
  );
}
