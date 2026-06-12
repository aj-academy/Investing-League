"use client";

import { buildCourseInquiryMessage, openWhatsApp } from "@/lib/marketing/whatsapp";

export function CourseLearnButton({
  courseName,
  className,
}: {
  courseName: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={
        className ||
        "bg-primary text-white px-4 py-2 rounded whitespace-nowrap hover:bg-primary/90 w-full"
      }
      onClick={() => openWhatsApp(buildCourseInquiryMessage(courseName))}
    >
      Syllabus on WhatsApp
    </button>
  );
}
