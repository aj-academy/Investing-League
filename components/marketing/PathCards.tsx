"use client";

import { CHOOSE_YOUR_PATH } from "@/lib/marketing/siteData";
import { LeadInquiryButton } from "./LeadModal";
import { CTAButton } from "./ui/CTAButton";

export function PathCards() {
  return (
    <div className="mkt-grid-3 mkt-path-grid">
      {CHOOSE_YOUR_PATH.map((path, i) => (
        <article
          key={path.title}
          className={`mkt-path-card${i === 1 ? " mkt-path-card--accent" : ""}`}
        >
          <h3>{path.title}</h3>
          <p>{path.description}</p>
          {path.href ? (
            <CTAButton
              href={path.href}
              variant={path.variant === "gold" ? "gold" : "outline"}
            >
              {path.cta}
            </CTAButton>
          ) : (
            <LeadInquiryButton
              interest={path.interest ?? "Course + Bundle"}
              title={path.cta}
              className="mkt-btn mkt-btn-outline"
            >
              {path.cta}
            </LeadInquiryButton>
          )}
        </article>
      ))}
    </div>
  );
}
