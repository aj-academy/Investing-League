"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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
    title: "Smart Market Scanner",
    text: "Multi-select asset chips, session filters, and min-grade controls for focused scanning.",
  },
  {
    icon: "🧠",
    title: "Signal Intelligence Engine",
    text: "V8 clean pipeline with permission boxes: Trade Allowed, Observe Only, Do Not Trade.",
  },
  {
    icon: "⚡",
    title: "Practice vs Live Mode",
    text: "Practice shows all filtered setups. Live selects the best signal per scan window.",
  },
  {
    icon: "📘",
    title: "Trading Journal",
    text: "Autosave signals, record platform quotes, track entry drift, and mark Win/Loss/Refund.",
  },
  {
    icon: "🛡️",
    title: "Risk Tracking",
    text: "Daily trade limits, news-risk windows, repeated-signal cooldown, and correlation awareness.",
  },
  {
    icon: "📊",
    title: "Performance Review",
    text: "Analytics by permission, pair, grade, and signal type — verified trades only for WR.",
  },
];

const WORKFLOW = [
  "Scan Market",
  "Find Setup",
  "Validate Risk",
  "Execute / Skip",
  "Journal Trade",
  "Review Performance",
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
    const id = window.setInterval(jitterScores, 4000);
    return () => window.clearInterval(id);
  }, [jitterScores]);

  return (
    <div className="lp-root">
      <div className="lp-bg-grid" aria-hidden="true">
        <div className="lp-glow g1" />
        <div className="lp-glow g2" />
      </div>

      <nav className="lp-nav">
        <div className="lp-wrap lp-nav-inner">
          <div className="lp-logo">
            <div className="lp-logo-mark">TIL</div>
            <div className="lp-logo-text">
              <div className="name">THE INVESTING LEAGUE</div>
              <div className="sub">Trading Decision Lab</div>
            </div>
          </div>
          <div className="lp-nav-links">
            <a href="#scanner">Scanner</a>
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <Link href="/login" className="lp-btn lp-btn-primary" style={{ padding: "10px 18px" }}>
              Start Decision Lab
            </Link>
          </div>
        </div>
      </nav>

      <header className="lp-hero">
        <div className="lp-wrap lp-hero-grid">
          <div>
            <div className="lp-eyebrow">
              <span className="dot" />
              Premium Fintech · Educational Only
            </div>
            <h1>
              <span>AI-Powered Market Intelligence</span> for Disciplined Traders
            </h1>
            <p className="sub">
              Scan selected assets, identify structured setups, track trading discipline, and improve
              decisions with journal analytics.
            </p>
            <div className="lp-hero-cta">
              <button type="button" className="lp-btn lp-btn-primary" onClick={() => scrollToId("cta")}>
                Start Decision Lab
              </button>
              <button type="button" className="lp-btn lp-btn-ghost" onClick={() => scrollToId("scanner")}>
                Open Scanner
              </button>
            </div>
            <p className="lp-hero-note">
              Built for traders who use structured scanners, signal testing, journaling, and risk tracking
              — not random entries.
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
                <div className="l">Trade Allowed</div>
              </div>
              <div className="lp-mock-stat">
                <div className="v">{topConf}%</div>
                <div className="l">Top Conf.</div>
              </div>
            </div>
            <div className="lp-mock-card">
              <div className="lp-mock-perm">✅ TRADE ALLOWED</div>
              <div className="lp-mock-row">
                <span>Pair</span>
                <strong>EUR/USD · CALL</strong>
              </div>
              <div className="lp-mock-row">
                <span>Grade</span>
                <strong>A+ · FINAL TRADE</strong>
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
            <h2>Asset Scanner Preview</h2>
            <p>Eight major FX pairs — the exact universe supported by The Investing League Decision Lab.</p>
          </div>
          <div className="lp-scanner-wrap">
            <div className="lp-scanner-head">
              <h3>LIVE SCANNER PREVIEW</h3>
              <div className="lp-live-pill">
                <i />
                SAMPLE DATA · EDUCATIONAL
              </div>
            </div>
            <table className="lp-scanner-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Bias</th>
                  <th>Score</th>
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
                    <td className="lp-score" data-label="Score">
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

      <section className="lp-section">
        <div className="lp-wrap">
          <div className="lp-disclaimer">
            <p>
              This platform is for educational analysis, signal testing, and trading journal support only.
              It does not guarantee profit and does not provide financial advice. Users are responsible for
              their own trading decisions.
            </p>
          </div>
        </div>
      </section>

      <section className="lp-final-cta" id="cta">
        <div className="lp-wrap">
          <h2>Stop Random Trading. Start Structured Decision Making.</h2>
          <p>
            Join disciplined traders using scanner intelligence, journal verification, and risk-aware
            workflows.
          </p>
          <Link href="/login" className="lp-btn lp-btn-gold">
            Launch Decision Lab
          </Link>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-footer-grid">
            <div className="brand-block">
              <div className="lp-logo">
                <div className="lp-logo-mark">TIL</div>
                <div className="lp-logo-text">
                  <div className="name">THE INVESTING LEAGUE</div>
                  <div className="sub">Trading Decision Lab</div>
                </div>
              </div>
              <p>
                Educational decision-support for FX binary traders. Scanner · Journal · Analytics · Risk
                discipline.
              </p>
            </div>
            <div className="lp-footer-links">
              <a href="#scanner">Scanner</a>
              <a href="#features">Features</a>
              <Link href="/login">Login</Link>
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
