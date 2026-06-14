import Link from "next/link";
import {
  CONTACT_INFO,
  EDUCATION_DISCLAIMER,
  SITE_TAGLINE,
} from "@/lib/marketing/siteData";
import { buildWhatsAppUrl, WHATSAPP_PRESETS } from "@/lib/marketing/whatsapp";

export function MarketingFooter() {
  const waHref = buildWhatsAppUrl(WHATSAPP_PRESETS.general);

  return (
    <footer className="mkt-footer">
      <div className="mkt-container">
        <div className="mkt-footer-grid">
          <div className="mkt-footer-col">
            <h3 className="mkt-footer-title">The Investing League</h3>
            <p className="mkt-footer-text">{SITE_TAGLINE}</p>
            <p className="mkt-footer-disclaimer">{EDUCATION_DISCLAIMER}</p>
          </div>
          <div className="mkt-footer-col">
            <h4 className="mkt-footer-heading">Quick links</h4>
            <ul className="mkt-footer-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/courses">Courses</Link></li>
              <li><Link href="/decision-lab">Scanner</Link></li>
              <li><Link href="/plans">Plans</Link></li>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms & Conditions</Link></li>
            </ul>
          </div>
          <div className="mkt-footer-col">
            <h4 className="mkt-footer-heading">Contact</h4>
            <ul className="mkt-footer-links">
              <li>{CONTACT_INFO.location}</li>
              <li>
                <a href={`mailto:${CONTACT_INFO.email}`}>{CONTACT_INFO.email}</a>
              </li>
              <li>{CONTACT_INFO.phone}</li>
              <li>
                <a href={waHref} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mkt-footer-bottom">
          <div className="mkt-footer-legal">
            <Link href="/privacy">Privacy Policy</Link>
            <span aria-hidden="true">·</span>
            <Link href="/terms">Terms & Conditions</Link>
          </div>
          <p className="mkt-footer-copy">
            © {new Date().getFullYear()} The Investing League. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
