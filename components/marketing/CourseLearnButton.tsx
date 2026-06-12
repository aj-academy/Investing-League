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
      className={className ?? "mkt-btn mkt-btn-primary mkt-btn-block"}
      onClick={() => openLeadModal({ interest: courseName, title: "Course enquiry" })}
    >
      Enquire now
    </button>
  );
}
