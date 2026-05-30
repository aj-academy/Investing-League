import type { ComputedSignal } from "@/lib/signal-engine/types";
import { getSessionQualityScore } from "@/lib/signal-engine/session";

export function SupportPanel({ signals }: { signals: ComputedSignal[] }) {
  if (!signals.length) return null;
  const top = signals[0];
  const calls = signals.filter((s) => s.direction === "CALL").length;
  const puts = signals.filter((s) => s.direction === "PUT").length;
  const aplus = signals.filter((s) => s.grade === "A+").length;
  const agrade = signals.filter((s) => s.grade === "A").length;
  const bgrade = signals.filter((s) => s.grade === "B").length;
  const avgConf = Math.round(signals.reduce((a, s) => a + s.conf, 0) / signals.length);
  const sessionScore = getSessionQualityScore();
  const bias = calls > puts ? "CALL BIAS" : puts > calls ? "PUT BIAS" : "MIXED BIAS";
  const biasColor = calls > puts ? "var(--bull)" : puts > calls ? "var(--bear)" : "var(--gold)";
  const cat = top.category;

  const bar = (label: string, val: number) => (
    <div className="sp-bar-row" key={label}>
      <div>{label}</div>
      <div className="sp-track">
        <div className="sp-fill" style={{ width: `${Math.max(0, Math.min(100, val))}%` }} />
      </div>
      <div>{val}%</div>
    </div>
  );

  return (
    <div className="support-panel">
      <div className="sp-inner">
        <div className="sp-head">
          <div>
            <div className="sp-title">MARKET SUPPORT PANEL</div>
            <div className="sp-sub">
              Use this right-side panel to validate the signal before entering. It summarizes bias,
              grade quality, structure, and entry safety.
            </div>
          </div>
          <div className="sp-badge" style={{ color: biasColor }}>
            {bias}
          </div>
        </div>
        <div className="sp-grid">
          <div className="sp-metric">
            <div className="sp-v" style={{ color: "var(--blue2)" }}>
              {signals.length}
            </div>
            <div className="sp-l">Signals</div>
          </div>
          <div className="sp-metric">
            <div className="sp-v" style={{ color: "var(--bull)" }}>
              {calls}
            </div>
            <div className="sp-l">CALL</div>
          </div>
          <div className="sp-metric">
            <div className="sp-v" style={{ color: "var(--bear)" }}>
              {puts}
            </div>
            <div className="sp-l">PUT</div>
          </div>
          <div className="sp-metric">
            <div className="sp-v" style={{ color: "var(--gold)" }}>
              {avgConf}%
            </div>
            <div className="sp-l">Avg Conf</div>
          </div>
        </div>
        <div className="sp-two">
          <div className="sp-card">
            <div className="sp-card-title">Top Setup</div>
            <div className="sp-line">
              <span>Pair</span>
              <span>{top.pair}</span>
            </div>
            <div className="sp-line">
              <span>Direction</span>
              <span style={{ color: top.direction === "CALL" ? "var(--bull)" : "var(--bear)" }}>
                {top.direction}
              </span>
            </div>
            <div className="sp-line">
              <span>Grade</span>
              <span>
                {top.grade} / {top.conf}%
              </span>
            </div>
            <div className="sp-line">
              <span>Structure</span>
              <span>{top.marketStructure.trend}</span>
            </div>
            <div className="sp-line">
              <span>EMA/WMA Bias</span>
              <span>{top.emaWmaBias}</span>
            </div>
            <div className="sp-line">
              <span>Entry Drift</span>
              <span>{top.maxEntryDrift}</span>
            </div>
          </div>
          <div className="sp-card">
            <div className="sp-card-title">Grade Mix</div>
            <div className="sp-line">
              <span>A+ Strong</span>
              <span>{aplus}</span>
            </div>
            <div className="sp-line">
              <span>A Quality</span>
              <span>{agrade}</span>
            </div>
            <div className="sp-line">
              <span>B Watch</span>
              <span>{bgrade}</span>
            </div>
            <div className="sp-line">
              <span>Session Score</span>
              <span>{sessionScore}%</span>
            </div>
            <div className="sp-line">
              <span>Source</span>
              <span>Twelve Data</span>
            </div>
          </div>
        </div>
        <div className="sp-card" style={{ marginBottom: 12 }}>
          <div className="sp-card-title">Top Signal Category Strength</div>
          <div className="sp-bars">
            {bar("Trend", cat.trend)}
            {bar("Momentum", cat.momentum)}
            {bar("Volatility", cat.volatility)}
            {bar("S/R", cat.sr)}
            {bar("Candle", cat.candle)}
          </div>
        </div>
        <div className="sp-list">
          <div className="sp-chip">
            <strong>Entry Rule:</strong>
            <br />
            {top.entryNote}
          </div>
          <div className="sp-chip">
            <strong>Bias Note:</strong>
            <br />
            {top.direction === "CALL"
              ? "Buy-side setup. Prefer entries only if price stays above support / pivot zone."
              : "Sell-side setup. Prefer entries only if price stays below resistance / pivot zone."}
          </div>
          <div className="sp-chip">
            <strong>Avoid:</strong>
            <br />
            Do not enter if the next candle opens far away from signal price.
          </div>
          <div className="sp-chip">
            <strong>Manual Check:</strong>
            <br />
            Confirm trend, candle close, and support/resistance before trade.
          </div>
        </div>
      </div>
    </div>
  );
}
