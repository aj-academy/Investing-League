import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-container">
        <div className="mkt-footer-grid">
          <div className="mkt-footer-col">
            <h3 className="mkt-footer-title">The Investing League</h3>
            <p className="mkt-footer-text">
              We teach people how to grow wealth through knowledge and smart investing.
            </p>
          </div>
          <div className="mkt-footer-col">
            <h4 className="mkt-footer-heading">Quick links</h4>
            <ul className="mkt-footer-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/courses">Courses</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/scanner">Scanner</Link></li>
            </ul>
          </div>
          <div className="mkt-footer-col">
            <h4 className="mkt-footer-heading">Contact</h4>
            <ul className="mkt-footer-links">
              <li>Chennai, Tamil Nadu, India</li>
              <li>info@investingleague.info</li>
              <li>+91 93614 89738</li>
            </ul>
          </div>
        </div>
        <div className="mkt-footer-bottom">
          © {new Date().getFullYear()} The Investing League. Educational content only.
        </div>
      </div>
    </footer>
  );
}
