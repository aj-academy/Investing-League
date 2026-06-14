"use client";

import { LeadInquiryButton } from "../LeadModal";

export function PricingCard({
  name,
  purpose,
  includes,
  cta,
  interest,
  featured,
}: {
  name: string;
  purpose: string;
  includes: string[];
  cta: string;
  interest: string;
  featured?: boolean;
}) {
  return (
    <article
      className={`mkt-pricing-card${featured ? " mkt-pricing-card--featured" : ""}`}
    >
      {featured && <span className="mkt-pricing-badge">Popular</span>}
      <h3 className="mkt-pricing-name">{name}</h3>
      <p className="mkt-pricing-purpose">{purpose}</p>
      <ul className="mkt-pricing-list">
        {includes.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <LeadInquiryButton
        interest={interest}
        title={`${name} enquiry`}
        className="mkt-btn mkt-btn-primary mkt-btn-block"
      >
        {cta}
      </LeadInquiryButton>
    </article>
  );
}
