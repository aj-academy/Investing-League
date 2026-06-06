import type { buildAnalyticsSummary } from "@/lib/analytics/summary";
import { journalPermission } from "@/lib/signal-engine/permission";

export type AnalyticsScanUsage = {
  scansToday: number;
  totalScans: number;
  dailyScanLimit: number;
  scansRemainingToday: number;
};

export function AnalyticsView({
  summary,
  rows = [],
  scanUsage,
}: {
  summary: ReturnType<typeof buildAnalyticsSummary>;
  rows?: { signal_type?: string | null; trade_eligible?: boolean | null }[];
  scanUsage?: AnalyticsScanUsage;
}) {
  let tradeAllowed = 0;
  let observe = 0;
  let blocked = 0;
  for (const r of rows) {
    const p = journalPermission(r.signal_type, r.trade_eligible);
    if (p === "TRADE ALLOWED") tradeAllowed++;
    else if (p === "OBSERVE ONLY") observe++;
    else blocked++;
  }

  return (
    <div>
      <div className="journal-title" style={{ marginBottom: 16 }}>
        PERFORMANCE ANALYTICS
      </div>

      {scanUsage && (
        <div className="journal-stats" style={{ marginBottom: 14 }}>
          <div className="jstat">
            <div className="jstat-v" style={{ color: "var(--blue2)" }}>
              {scanUsage.scansToday}
            </div>
            <div className="jstat-l">Scans Today</div>
          </div>
          <div className="jstat">
            <div className="jstat-v" style={{ color: "var(--cyan)" }}>
              {scanUsage.totalScans}
            </div>
            <div className="jstat-l">Total Scans</div>
          </div>
          <div className="jstat">
            <div className="jstat-v" style={{ color: "var(--gold2)" }}>
              {scanUsage.dailyScanLimit}
            </div>
            <div className="jstat-l">Daily Limit</div>
          </div>
          <div className="jstat">
            <div
              className="jstat-v"
              style={{ color: scanUsage.scansRemainingToday > 0 ? "var(--bull)" : "var(--bear)" }}
            >
              {scanUsage.scansRemainingToday}
            </div>
            <div className="jstat-l">Remaining Today</div>
          </div>
        </div>
      )}

      <div className="journal-stats">
        {[
          ["Total Signals", summary.totalSignals, "var(--blue2)"],
          ["Trade Allowed", tradeAllowed, "var(--bull)"],
          ["Observation", observe, "var(--gold2)"],
          ["Do Not Trade", blocked, "var(--bear)"],
          ["Trade Eligible", summary.tradeEligible, "var(--txt2)"],
          ["Completed", summary.completedTrades, "var(--txt2)"],
          ["Final Trade WR", `${summary.finalTradeWinRate}%`, "var(--bull2)"],
          ["Observation Accuracy", `${summary.observationAccuracy}%`, "var(--gold)"],
          ["Invalid Entries", summary.invalidEntries, "var(--warn)"],
          ["Refunds", summary.refunds, "var(--purple)"],
          ["Pending", summary.pending, "var(--gold)"],
        ].map(([label, val, color]) => (
          <div className="jstat" key={label as string}>
            <div className="jstat-v" style={{ color: color as string }}>
              {val as string | number}
            </div>
            <div className="jstat-l">{label as string}</div>
          </div>
        ))}
      </div>

      <div className="landing-grid" style={{ marginTop: 16 }}>
        <div className="landing-card">
          <h3>Best Pair</h3>
          <p>{summary.bestPair}</p>
        </div>
        <div className="landing-card">
          <h3>Best Timeframe</h3>
          <p>{summary.bestTimeframe}</p>
        </div>
        <div className="landing-card">
          <h3>Best Grade</h3>
          <p>{summary.bestGrade}</p>
        </div>
        <div className="landing-card">
          <h3>Best Signal Type</h3>
          <p>{summary.bestSignalType}</p>
        </div>
      </div>

      <div className="ctrl" style={{ marginTop: 16 }}>
        <div className="ctrl-title">Loss Reason Breakdown</div>
        <div className="sp-bars">
          {Object.entries(summary.lossReasons).map(([reason, count]) => (
            <div className="sp-bar-row" key={reason}>
              <div>{reason}</div>
              <div className="sp-track">
                <div
                  className="sp-fill"
                  style={{
                    width: `${Math.min(100, count * 20)}%`,
                    background: "var(--bear)",
                  }}
                />
              </div>
              <div>{count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="ctrl" style={{ marginTop: 14 }}>
        <div className="ctrl-title">Entry Drift Analysis</div>
        <p style={{ fontSize: 11, color: "var(--m3)" }}>
          Valid: {summary.entryDrift.valid} · Risky: {summary.entryDrift.risky} · Invalid:{" "}
          {summary.entryDrift.invalid} · Pending: {summary.entryDrift.pending}
        </p>
      </div>
    </div>
  );
}
