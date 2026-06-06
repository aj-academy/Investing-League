"use client";

import { buildPlanInquiryWhatsAppUrl } from "@/lib/pricing/whatsapp";
import type { PricingPlan } from "@/lib/pricing/types";
import { useEffect, useState } from "react";

export function PricingSection() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => r.json())
      .then((json) => setPlans(json.plans || []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="lp-section" id="pricing">
      <div className="lp-wrap">
        <div className="lp-sec-head">
          <h2>Subscription Plans</h2>
          <p>
            Choose a plan that fits your trading journey. Pay via WhatsApp — our team will verify
            payment and activate your account.
          </p>
        </div>

        {loading ? (
          <p className="lp-pricing-empty">Loading plans...</p>
        ) : plans.length === 0 ? (
          <p className="lp-pricing-empty">
            Plans are being updated. Contact us on WhatsApp for enrollment.
          </p>
        ) : (
          <div className="lp-pricing-wrap">
            <table className="lp-pricing-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Price</th>
                  <th>Best For</th>
                  <th>Access</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr
                    key={plan.id}
                    className={plan.is_highlighted ? "lp-pricing-highlight" : undefined}
                  >
                    <td className="lp-pricing-plan" data-label="Plan">
                      <strong>{plan.name}</strong>
                      {plan.is_highlighted && <span className="lp-pricing-badge">Popular</span>}
                    </td>
                    <td className="lp-pricing-price" data-label="Price">
                      {plan.price_label}
                    </td>
                    <td data-label="Best For">{plan.best_for}</td>
                    <td className="lp-pricing-access" data-label="Access">
                      {plan.access_description}
                    </td>
                    <td data-label="Action">
                      <a
                        href={buildPlanInquiryWhatsAppUrl(plan.name, plan.price_label)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lp-btn lp-btn-primary lp-pricing-pay"
                      >
                        Pay via WhatsApp
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="lp-pricing-note">
          After payment, our admin team will create your login credentials. Only approved accounts can
          sign in to the Decision Lab.
        </p>
      </div>
    </section>
  );
}
