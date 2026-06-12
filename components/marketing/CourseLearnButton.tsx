"use client";

import { useLeadModal } from "./LeadModal";

export function CourseLearnButton({
  courseName,
  className,
}: {
  courseName: string;
  className?: string;
}) {
  const { openLeadModal } = useLeadModal();

  return (
    <button
      type="button"
      className={
        className ||
        "bg-primary text-white px-4 py-2 rounded whitespace-nowrap hover:bg-primary/90 w-full"
      }
      onClick={() => openLeadModal({ interest: courseName, title: "Course enquiry" })}
    >
      Enquire now
    </button>
  );
}
