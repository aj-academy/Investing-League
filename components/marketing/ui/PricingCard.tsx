"use client";

import { LeadInquiryButton } from "../LeadModal";

export function PricingCard({
  name,
  bestFor,
  purpose,
  includes,
  cta,
  interest,
  priceNote,
  featured,
}: {
  name: string;
  bestFor: string;
  purpose: string;
  includes: string[];
  cta: string;
  interest: string;
  priceNote?: string;
  featured?: boolean;
}) {
  return (
    <article
      className={`mkt-pricing-card${featured ? " mkt-pricing-card--featured" : ""}`}
    >
      {featured && <span className="mkt-pricing-badge">Popular</span>}
      <p className="mkt-pricing-best">Best for: {bestFor}</p>
      <h3 className="mkt-pricing-name">{name}</h3>
      <p className="mkt-pricing-purpose">{purpose}</p>
      {priceNote && <p className="mkt-pricing-price-note">{priceNote}</p>}
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
