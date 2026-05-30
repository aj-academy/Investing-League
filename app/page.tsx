import Link from "next/link";
import { DISCLAIMER } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="z">
      <section className="landing-hero">
        <h1>THE INVESTING LEAGUE</h1>
        <p style={{ fontFamily: "var(--mono)", color: "var(--gold2)", letterSpacing: 2, marginBottom: 8 }}>
          DECISION LAB
        </p>
        <p>
          The Investing League Decision Lab is an educational decision-support and trade journaling
          platform for market setup scanning, signal testing, discipline tracking, and performance
          analytics.
        </p>
        <div className="landing-cta">
          <Link href="/login" className="landing-btn primary">
            Start Decision Lab
          </Link>
          <Link href="/login" className="landing-btn secondary">
            Open Scanner
          </Link>
        </div>
      </section>

      <section className="landing-section">
        <h2 style={{ color: "var(--txt2)", marginBottom: 16, fontFamily: "var(--mono)", letterSpacing: 2 }}>
          PLATFORM FEATURES
        </h2>
        <div className="landing-grid">
          {[
            {
              title: "Educational Scanner",
              text: "Multi-factor market setup scanning with EMA/WMA bias, ADX filter, candle strength, and V4 classification.",
            },
            {
              title: "Practice vs Live Mode",
              text: "Practice Mode collects observation data. Live Mode selects the best trade-eligible signal per scan window.",
            },
            {
              title: "Journal Analytics",
              text: "Track trade discipline, entry drift, observation accuracy, and performance review with CSV/JSON export.",
            },
            {
              title: "Risk-Aware Analysis",
              text: "Signal testing without profit claims. Refund logic, invalid entry tracking, and real trade win rate rules built in.",
            },
          ].map((f) => (
            <div key={f.title} className="landing-card">
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" style={{ textAlign: "center" }}>
        <h2 style={{ color: "var(--gold2)", marginBottom: 12 }}>Track Your Trading Discipline</h2>
        <p style={{ color: "var(--m3)", maxWidth: 640, margin: "0 auto 20px", lineHeight: 1.8 }}>
          Record Olymp opening and closing quotes, auto-calculate Win/Loss/Refund, and review
          performance by pair, timeframe, grade, and signal type.
        </p>
        <Link href="/login" className="landing-btn primary">
          Start Decision Lab
        </Link>
      </section>

      <section className="landing-section">
        <div className="disclaimer-banner" style={{ maxWidth: 800, margin: "0 auto" }}>
          {DISCLAIMER}
        </div>
      </section>
    </div>
  );
}
