"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PricingSection } from "@/components/landing/PricingSection";

type Bias = "buy" | "sell" | "wait";
type Risk = "low" | "med" | "high";

interface AssetRow {
  pair: string;
  bias: Bias;
  score: number;
  setup: string;
  risk: Risk;
}

const INITIAL_ASSETS: AssetRow[] = [
  { pair: "EUR/USD", bias: "buy", score: 78, setup: "Trend Pullback · A+", risk: "low" },
  { pair: "GBP/USD", bias: "sell", score: 71, setup: "EMA Rejection · A", risk: "med" },
  { pair: "USD/JPY", bias: "buy", score: 68, setup: "Momentum Continuation", risk: "med" },
  { pair: "USD/CHF", bias: "wait", score: 54, setup: "Range · Observe", risk: "low" },
  { pair: "AUD/USD", bias: "sell", score: 73, setup: "Breakdown Retest · A", risk: "med" },
  { pair: "USD/CAD", bias: "buy", score: 66, setup: "Session Open Bias", risk: "high" },
  { pair: "NZD/USD", bias: "wait", score: 52, setup: "Low Volatility · B", risk: "low" },
  { pair: "EUR/GBP", bias: "sell", score: 69, setup: "Cross Pair Reversal", risk: "med" },
];

const BIAS_LABEL: Record<Bias, string> = { buy: "BUY", sell: "SELL", wait: "WAIT" };
const RISK_LABEL: Record<Risk, string> = { low: "Low", med: "Medium", high: "High" };

const FEATURES = [
  {
    icon: "📡",
    title: "Educational Market Scanner",
    text: "Multi-select asset chips, session filters, and grade controls for focused observation study.",
  },
  {
    icon: "🧠",
    title: "Decision Support Engine",
    text: "Structured pipeline with study categories: qualified setup, observe only, and do not study.",
  },
  {
    icon: "⚡",
    title: "Practice vs Live Mode",
    text: "Practice shows filtered setups for learning. Live mode selects one observation per window.",
  },
  {
    icon: "📘",
    title: "Learning Journal",
    text: "Record observations, platform notes, decision drift, and review outcomes for discipline.",
  },
  {
    icon: "🛡️",
    title: "Risk Awareness",
    text: "Daily limits, news-risk windows, repeated-setup cooldown, and correlation awareness.",
  },
  {
    icon: "📊",
    title: "Performance Review",
    text: "Analytics by setup quality, pair, grade, and observation type — for learning review only.",
  },
];

const WORKFLOW = [
  "Observe Market",
  "Study Setup",
  "Check Risk",
  "Decide / Skip",
  "Journal Entry",
  "Review Patterns",
];

const RESPONSIBLE_STEPS = [
  "Observe the setup",
  "Check confidence and risk level",
  "Record the decision in journal",
  "Review mistakes and patterns",
  "Learn discipline before real market decisions",
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function PremiumLanding() {
  const [assets, setAssets] = useState(INITIAL_ASSETS);

  const topConf = useMemo(() => Math.max(...assets.map((a) => a.score)), [assets]);
  const tradeAllowed = useMemo(
    () => assets.filter((a) => a.score >= 70 && a.bias !== "wait").length,
    [assets],
  );

  const jitterScores = useCallback(() => {
    setAssets((prev) =>
      prev.map((a) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return { ...a, score: Math.max(45, Math.min(92, a.score + delta)) };
      }),
    );
  }, []);

  useEffect(() => {
    let id: number | undefined;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      jitterScores();
    };
    const start = () => {
      window.clearInterval(id);
      id = window.setInterval(tick, 8000);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else window.clearInterval(id);
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [jitterScores]);

  return (
    <div className="lp-root">
      <div className="lp-bg-grid" aria-hidden="true">
        <div className="lp-glow g1" />
        <div className="lp-glow g2" />
      </div>

      <nav className="lp-nav">
        <div className="lp-wrap lp-nav-inner">
          <Link href="/" className="lp-logo">
            <div className="lp-logo-mark">
              <img src="/Icon.png" alt="" width={28} height={28} style={{ borderRadius: 6 }} />
            </div>
            <div className="lp-logo-text">
              <div className="name">THE INVESTING LEAGUE</div>
              <div className="sub">Trading Decision Lab</div>
            </div>
          </Link>
          <div className="lp-nav-links">
            <Link href="/">Home</Link>
            <Link href="/courses">Courses</Link>
            <a href="#scanner">Scanner</a>
            <a href="#features">Features</a>
            <a href="#pricing">Plans</a>
            <Link href="/plans">View Plans</Link>
            <Link href="/login" className="lp-btn lp-btn-primary" style={{ padding: "10px 18px" }}>
              Member Login
            </Link>
          </div>
        </div>
      </nav>

      <header className="lp-hero">
        <div className="lp-wrap lp-hero-grid">
          <div>
            <div className="lp-eyebrow">
              <span className="dot" />
              Educational Decision Lab · Observation Only
            </div>
            <h1>
              <span>Educational Market Decision Lab</span> for Disciplined Learners
            </h1>
            <p className="sub">
              Observe selected assets, study structured setups, maintain a learning journal, and
              build risk awareness — not investment advice.
            </p>
            <div className="lp-hero-cta">
              <Link href="/login" className="lp-btn lp-btn-primary">
                Member Login
              </Link>
              <button type="button" className="lp-btn lp-btn-ghost" onClick={() => scrollToId("scanner")}>
                View 8-Asset Preview
              </button>
            </div>
            <p className="lp-hero-note">
              Eight major FX pairs with sample scores and setups — educational preview only. Full
              scanner access after member login.
            </p>
          </div>

          <div className="lp-mockup" aria-hidden="true">
            <div className="lp-mock-top">
              <div className="lp-mock-dots">
                <i />
                <i />
                <i />
              </div>
              <div className="lp-mock-title">DECISION LAB · V8 ENGINE</div>
            </div>
            <div className="lp-mock-stats">
              <div className="lp-mock-stat">
                <div className="v">8</div>
                <div className="l">Assets</div>
              </div>
              <div className="lp-mock-stat">
                <div className="v">{tradeAllowed}</div>
                <div className="l">Qualified Setups</div>
              </div>
              <div className="lp-mock-stat">
                <div className="v">{topConf}%</div>
                <div className="l">Top Conf.</div>
              </div>
            </div>
            <div className="lp-mock-card">
              <div className="lp-mock-perm">✅ SETUP QUALIFIED FOR STUDY</div>
              <div className="lp-mock-row">
                <span>Pair</span>
                <strong>EUR/USD · Observation</strong>
              </div>
              <div className="lp-mock-row">
                <span>Grade</span>
                <strong>A+ · High-Quality Observation Setup</strong>
              </div>
              <div className="lp-mock-bar">
                <i />
              </div>
            </div>
            <div className="lp-mock-card" style={{ opacity: 0.65 }}>
              <div className="lp-mock-perm" style={{ color: "var(--lp-gold2)" }}>
                ⚠️ OBSERVE ONLY
              </div>
              <div className="lp-mock-row">
                <span>Pair</span>
                <strong>GBP/USD · PUT</strong>
              </div>
              <div className="lp-mock-row">
                <span>Grade</span>
                <strong>A · WATCH</strong>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="lp-stats">
        <div className="lp-wrap lp-stats-grid">
          <div className="lp-stat-card">
            <div className="num">8</div>
            <div className="lbl">Assets</div>
          </div>
          <div className="lp-stat-card">
            <div className="num">V8</div>
            <div className="lbl">Multi-Factor Scanner</div>
          </div>
          <div className="lp-stat-card">
            <div className="num">Risk</div>
            <div className="lbl">Risk-Aware Analysis</div>
          </div>
          <div className="lp-stat-card">
            <div className="num">Journal</div>
            <div className="lbl">Journal Analytics</div>
          </div>
        </div>
      </section>

      <section className="lp-section" id="scanner">
        <div className="lp-wrap">
            <div className="lp-sec-head">
            <h2>Educational Scanner Preview</h2>
            <p>Eight major FX pairs — sample observation data for learning only.</p>
          </div>
          <div className="lp-scanner-wrap">
            <div className="lp-scanner-head">
              <h3>SAMPLE OBSERVATION PREVIEW</h3>
              <div className="lp-live-pill">
                <i />
                SAMPLE DATA · EDUCATIONAL
              </div>
            </div>
            <table className="lp-scanner-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Direction</th>
                  <th>Confidence</th>
                  <th>Setup</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.pair}>
                    <td className="lp-asset" data-label="Asset">
                      {a.pair}
                    </td>
                    <td data-label="Bias">
                      <span className={`lp-bias ${a.bias}`}>{BIAS_LABEL[a.bias]}</span>
                    </td>
                    <td className="lp-score" data-label="Confidence">
                      {a.score}%
                    </td>
                    <td className="lp-setup" data-label="Setup">
                      {a.setup}
                    </td>
                    <td data-label="Risk">
                      <span className={`lp-risk ${a.risk}`}>{RISK_LABEL[a.risk]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="lp-section" id="features">
        <div className="lp-wrap">
          <div className="lp-sec-head">
            <h2>Platform Features</h2>
            <p>Professional-grade tools for structured decision-making — not hype, not profit promises.</p>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="lp-feat">
                <div className="lp-feat-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      <section className="lp-section" id="workflow">
        <div className="lp-wrap">
          <div className="lp-sec-head">
            <h2>Structured Workflow</h2>
            <p>Replace impulsive entries with a repeatable decision process.</p>
          </div>
          <div className="lp-workflow">
            {WORKFLOW.map((step, i) => (
              <span key={step} style={{ display: "contents" }}>
                {i > 0 && <span className="lp-wf-arrow">→</span>}
                <div className="lp-wf-step">
                  <div className="n">{String(i + 1).padStart(2, "0")}</div>
                  <div className="t">{step}</div>
                </div>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" id="responsible">
        <div className="lp-wrap">
          <div className="lp-sec-head">
            <h2>How to Use Decision Lab Responsibly</h2>
            <p>A disciplined learning sequence — not a shortcut to profit.</p>
          </div>
          <div className="lp-workflow">
            {RESPONSIBLE_STEPS.map((step, i) => (
              <span key={step} style={{ display: "contents" }}>
                {i > 0 && <span className="lp-wf-arrow">→</span>}
                <div className="lp-wf-step">
                  <div className="n">{String(i + 1).padStart(2, "0")}</div>
                  <div className="t">{step}</div>
                </div>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <div className="lp-disclaimer">
            <p>
              The Decision Lab is for educational observation, journaling, and learning discipline.
              It is not investment advice, not a trade recommendation, and not a guarantee of profit.
              Users are responsible for their own market decisions.
            </p>
          </div>
        </div>
      </section>

      <section className="lp-final-cta" id="cta">
        <div className="lp-wrap">
          <h2>Build Discipline Before You Decide in Real Markets</h2>
          <p>
            Members use Decision Lab for structured observation, journaling, and risk-aware learning
            workflows.
          </p>
          <Link href="/login" className="lp-btn lp-btn-gold">
            Member Login
          </Link>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-footer-grid">
            <div className="brand-block">
              <Link href="/" className="lp-logo">
                <div className="lp-logo-mark">
                  <img src="/Icon.png" alt="" width={28} height={28} style={{ borderRadius: 6 }} />
                </div>
                <div className="lp-logo-text">
                  <div className="name">THE INVESTING LEAGUE</div>
                  <div className="sub">Trading Decision Lab</div>
                </div>
              </Link>
              <p>
                Educational decision-support for market learners. Observation · Journal · Analytics ·
                Risk discipline.
              </p>
            </div>
            <div className="lp-footer-links">
              <a href="#scanner">Scanner preview</a>
              <a href="#features">Features</a>
              <Link href="/plans">Plans</Link>
              <Link href="/courses">Courses</Link>
              <Link href="/login">Member Login</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>
          </div>
          <div className="lp-footer-copy">
            © 2026 The Investing League. Educational use only. Not financial advice. Past performance does
            not guarantee future results.
          </div>
        </div>
      </footer>
    </div>
  );
}
