"use client";

import type { buildAnalyticsSummary } from "@/lib/analytics/summary";
import type { JournalRow } from "@/lib/analytics/summary";
import { useMemo, useState } from "react";
import {
  buildHealthNarrative,
  buildRecommendations,
  computeBotQualityScore,
  deriveHealthStatus,
  deriveRiskLevel,
  normalizedLossBreakdown,
  pairWinRates,
  permissionCountsFromRows,
  showDataQualityWarning,
  signalTypeBucketStats,
} from "@/lib/analytics/insights";
import { PLATFORM_DISCLAIMER } from "@/lib/platform/userCopy";
import {
  AnalyticsBarRow,
  AnalyticsDonut,
  AnalyticsStackedBar,
  RiskMeter,
} from "./AnalyticsVisuals";

export type AnalyticsScanUsage = {
  scansToday: number;
  totalScans: number;
  dailyScanLimit: number;
  scansRemainingToday: number;
};

function statusClass(status: string) {
  if (status === "GOOD") return "health-good";
  if (status === "CAUTION") return "health-caution";
  return "health-risk";
}

type ProfitRange = "7d" | "30d" | "week" | "month" | "all";
type ProfitGroup = "day" | "week";

type ProfitPoint = {
  key: string;
  label: string;
  profit: number;
  wins: number;
  losses: number;
  trades: number;
};

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfWeek(d: Date) {
  const base = startOfDay(d);
  const day = base.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday-start week
  base.setDate(base.getDate() + diff);
  return base;
}

function weekLabel(d: Date) {
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  return `${d.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

function includeByRange(date: Date, range: ProfitRange, now: Date) {
  const rowDay = startOfDay(date);
  const today = startOfDay(now);
  if (range === "all") return true;
  if (range === "7d") {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return rowDay >= from;
  }
  if (range === "30d") {
    const from = new Date(today);
    from.setDate(from.getDate() - 29);
    return rowDay >= from;
  }
  if (range === "week") {
    return rowDay >= startOfWeek(today);
  }
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  return rowDay >= monthStart;
}

function rangeLabel(range: ProfitRange) {
  if (range === "7d") return "Last 7 days";
  if (range === "30d") return "Last 30 days";
  if (range === "week") return "This week";
  if (range === "month") return "This month";
  return "All time";
}

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function AnalyticsView({
  summary,
  rows = [],
  scanUsage,
}: {
  summary: ReturnType<typeof buildAnalyticsSummary>;
  rows?: JournalRow[];
  scanUsage?: AnalyticsScanUsage;
}) {
  const journalRows = rows as JournalRow[];
  const [profitRange, setProfitRange] = useState<ProfitRange>("7d");
  const [profitGroup, setProfitGroup] = useState<ProfitGroup>("day");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const permissionCounts = permissionCountsFromRows(journalRows);
  const healthStatus = deriveHealthStatus(
    summary.finalTradeWinRate,
    summary.completedTrades
  );
  const healthLabel =
    healthStatus === "HIGH RISK" && summary.completedTrades < 20
      ? "HIGH RISK / NEED MORE DATA"
      : healthStatus;
  const narrative = buildHealthNarrative(
    healthStatus,
    summary.finalTradeWinRate,
    summary.completedTrades,
    summary.bestPair
  );
  const risk = deriveRiskLevel(summary, summary.finalTradeWinRate);
  const botScore = computeBotQualityScore(summary);
  const dataWarning = showDataQualityWarning(summary);
  const pairRates = pairWinRates(summary);
  const signalBuckets = signalTypeBucketStats(summary, journalRows);
  const lossBuckets = normalizedLossBreakdown(journalRows);
  const maxLoss = Math.max(1, ...lossBuckets.map((l) => l.count));
  const recommendations = buildRecommendations(summary, journalRows, permissionCounts);
  const profitRows = journalRows as Array<
    JournalRow & {
      net_profit?: number | null;
      trade_amount?: number | null;
      return_amount?: number | null;
      marked_time?: string | null;
      updated_at?: string | null;
    }
  >;

  const profitSeries = useMemo(() => {
    const now = new Date();
    const bucket = new Map<string, ProfitPoint>();
    for (const row of profitRows) {
      const settledAt = row.marked_time || row.updated_at || row.created_at;
      if (!settledAt) continue;
      const dt = new Date(settledAt);
      if (Number.isNaN(dt.getTime())) continue;
      const dayKey = toIsoDate(dt);
      const inCustomRange =
        (!customFrom || dayKey >= customFrom) && (!customTo || dayKey <= customTo);
      if (profitRange === "all" && (customFrom || customTo) && !inCustomRange) continue;
      if (profitRange !== "all" && !includeByRange(dt, profitRange, now)) continue;

      const keyDate = profitGroup === "week" ? startOfWeek(dt) : startOfDay(dt);
      const key = keyDate.toISOString().slice(0, 10);
      const label =
        profitGroup === "week"
          ? weekLabel(keyDate)
          : `${keyDate.toLocaleDateString(undefined, { weekday: "short" })}, ${keyDate.toLocaleDateString()}`;
      const current = bucket.get(key) ?? { key, label, profit: 0, wins: 0, losses: 0, trades: 0 };
      const rawProfit =
        row.net_profit != null ? toNumber(row.net_profit) : toNumber(row.return_amount) - toNumber(row.trade_amount);

      current.profit += rawProfit;
      if (row.result === "Win") current.wins += 1;
      if (row.result === "Loss") current.losses += 1;
      if (row.result === "Win" || row.result === "Loss" || row.result === "Refund") current.trades += 1;
      bucket.set(key, current);
    }
    return [...bucket.values()].sort((a, b) => a.key.localeCompare(b.key));
  }, [profitRows, profitRange, profitGroup, customFrom, customTo]);

  const profitPeak = Math.max(1, ...profitSeries.map((p) => Math.abs(p.profit)));
  const periodProfit = profitSeries.reduce((acc, p) => acc + p.profit, 0);

  const distributionSegments = [
    { label: "Wins", value: summary.wins, color: "var(--bull)" },
    { label: "Losses", value: summary.losses, color: "var(--bear)" },
    { label: "Refunds", value: summary.refunds, color: "var(--purple)" },
    { label: "Pending", value: summary.pending, color: "var(--gold)" },
  ];

  const coreMetrics: Array<{
    label: string;
    value: string | number;
    tone?: string;
    large?: boolean;
  }> = [
    { label: "Total Signals", value: summary.totalSignals, tone: "stat-blue" },
    {
      label: "Trade-Eligible Signals",
      value: permissionCounts.tradeAllowed,
      tone: "stat-bull",
    },
    {
      label: "Watch / Observation",
      value: permissionCounts.observe,
      tone: "stat-gold",
    },
    {
      label: "Rejected Risky Signals",
      value: permissionCounts.blocked,
      tone: "stat-bear",
    },
    { label: "Trade Eligible (journal)", value: summary.tradeEligible },
    {
      label: "Verified Results",
      value: summary.completedTrades,
      large: true,
    },
    {
      label: "Verified Final Trade Win Rate",
      value: `${summary.finalTradeWinRate}%`,
      tone: "stat-bull",
      large: true,
    },
    {
      label: "Observation Accuracy",
      value: `${summary.observationAccuracy}%`,
      tone: "stat-gold",
    },
    { label: "Invalid Entries", value: summary.invalidEntries, tone: "stat-warn" },
    { label: "Refunds", value: summary.refunds, tone: "stat-purple" },
    {
      label: "Unverified / Pending",
      value: summary.pending,
      tone: "stat-gold",
    },
  ];

  return (
    <div className="analytics-page">
      <div className="journal-title analytics-page-title">PERFORMANCE ANALYTICS</div>
      <p className="analytics-page-sub">
        Decision-focused view of your journal — what is working, what to avoid, and whether
        your data is reliable enough to act on.
      </p>

      <div className={`analytics-health-card ${statusClass(healthStatus)}`}>
        <div className="analytics-health-top">
          <div>
            <div className="analytics-health-kicker">Performance health summary</div>
            <div className="analytics-health-status">Current status: {healthLabel}</div>
          </div>
          <div className="analytics-health-score-pill">
            Bot quality: <strong>{botScore}</strong>/100
          </div>
        </div>
        <div className="analytics-health-grid">
          <div className="analytics-health-stat">
            <span className="lbl">Verified Final Trade WR</span>
            <span className="val">{summary.finalTradeWinRate}%</span>
          </div>
          <div className="analytics-health-stat">
            <span className="lbl">Verified Results</span>
            <span className="val">{summary.completedTrades}</span>
          </div>
          <div className="analytics-health-stat">
            <span className="lbl">Best Pair</span>
            <span className="val">{summary.bestPair}</span>
          </div>
          <div className="analytics-health-stat">
            <span className="lbl">Real Trades (WR basis)</span>
            <span className="val">{summary.realTradeTotal}</span>
          </div>
          <div className="analytics-health-stat">
            <span className="lbl">Pending Order WR</span>
            <span className="val">
              {summary.pendingOrderTotal ? `${summary.pendingOrderWinRate}%` : "—"}
            </span>
          </div>
          <div className="analytics-health-stat">
            <span className="lbl">Manual Entry WR</span>
            <span className="val">
              {summary.manualEntryTotal ? `${summary.manualEntryWinRate}%` : "—"}
            </span>
          </div>
        </div>
        <div className="analytics-health-warn">
          <strong>Main warning:</strong> {narrative.mainWarning}
        </div>
        <div className="analytics-health-action">
          <strong>Recommended action:</strong> {narrative.recommendedAction}
        </div>
      </div>

      <div className="analytics-side-row">
        <RiskMeter level={risk.level} reason={risk.reason} />
        <div className="analytics-bot-score">
          <div className="analytics-bot-score-val">{botScore}/100</div>
          <div className="analytics-bot-score-lbl">Bot Quality Score</div>
          <p>
            This score measures testing quality and signal reliability, not guaranteed
            profitability.
          </p>
        </div>
      </div>

      {dataWarning && (
        <div className="analytics-warning-card">
          <strong>Data quality warning:</strong> Only {summary.completedTrades} out of{" "}
          {summary.totalSignals} signals are verified. Analytics accuracy improves after more
          completed trade results.
        </div>
      )}

      {scanUsage && (
        <div className="analytics-section">
          <div className="analytics-section-head">Scan activity</div>
          <div className="journal-stats analytics-metrics-grid">
            <div className="jstat">
              <div className="jstat-v stat-blue">{scanUsage.scansToday}</div>
              <div className="jstat-l">Scans Today</div>
            </div>
            <div className="jstat">
              <div className="jstat-v stat-cyan">{scanUsage.totalScans}</div>
              <div className="jstat-l">Total Scans</div>
            </div>
            <div className="jstat">
              <div className="jstat-v stat-gold">{scanUsage.dailyScanLimit}</div>
              <div className="jstat-l">Daily API Limit</div>
            </div>
            <div className="jstat">
              <div
                className={`jstat-v ${scanUsage.scansRemainingToday > 0 ? "stat-bull" : "stat-bear"}`}
              >
                {scanUsage.scansRemainingToday}
              </div>
              <div className="jstat-l">Remaining Today</div>
            </div>
          </div>
        </div>
      )}

      <div className="analytics-section">
        <div className="analytics-section-head">Core metrics</div>
        <div className="journal-stats analytics-metrics-grid">
          {coreMetrics.map((m) => (
            <div
              key={m.label}
              className={`jstat ${m.large ? "analytics-metric-lg" : ""}`}
            >
              <div className={`jstat-v ${m.tone || ""}`}>{m.value}</div>
              <div className="jstat-l">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="analytics-section">
        <div className="analytics-section-head">Best performers (win rate basis)</div>
        <div className="analytics-best-grid">
          <div className="landing-card analytics-best-card">
            <h3>Best Pair</h3>
            <p>{summary.bestPair}</p>
          </div>
          <div className="landing-card analytics-best-card">
            <h3>Best Timeframe</h3>
            <p>{summary.bestTimeframe}</p>
          </div>
          <div className="landing-card analytics-best-card">
            <h3>Best Grade</h3>
            <p>{summary.bestGrade}</p>
          </div>
          <div className="landing-card analytics-best-card">
            <h3>Best Signal Type (Win Rate)</h3>
            <p>{summary.bestSignalType}</p>
          </div>
          <div className="landing-card analytics-best-card">
            <h3>Most Frequent Signal Type</h3>
            <p>{summary.mostFrequentSignalType}</p>
          </div>
        </div>
      </div>

      <div className="analytics-section">
        <div className="analytics-section-head">Profit filter (day / week)</div>
        <div className="ctrl analytics-chart-card">
          <div className="analytics-profit-filters">
            <div className="f">
              <label>Range</label>
              <select
                value={profitRange}
                onChange={(e) => {
                  const next = e.target.value as ProfitRange;
                  setProfitRange(next);
                  if (next !== "all") {
                    setCustomFrom("");
                    setCustomTo("");
                  }
                }}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="all">All time</option>
              </select>
            </div>
            <div className="f">
              <label>Group by</label>
              <select
                value={profitGroup}
                onChange={(e) => setProfitGroup(e.target.value as ProfitGroup)}
              >
                <option value="day">Day-wise</option>
                <option value="week">Week-wise</option>
              </select>
            </div>
            <div className="f">
              <label>From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => {
                  setProfitRange("all");
                  setCustomFrom(e.target.value);
                }}
              />
            </div>
            <div className="f">
              <label>To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => {
                  setProfitRange("all");
                  setCustomTo(e.target.value);
                }}
              />
            </div>
            <div className="analytics-profit-total">
              <small>
                {(customFrom || customTo)
                  ? `Custom: ${customFrom || "start"} to ${customTo || "today"}`
                  : `${rangeLabel(profitRange)} net profit`}
              </small>
              <strong className={periodProfit >= 0 ? "stat-bull" : "stat-bear"}>
                {periodProfit.toFixed(2)}
              </strong>
            </div>
          </div>
          {profitSeries.length === 0 ? (
            <p className="analytics-empty">No profit data available for this filter</p>
          ) : (
            profitSeries.map((row) => (
              <AnalyticsBarRow
                key={row.key}
                label={`${row.label} (W:${row.wins} L:${row.losses})`}
                value={Math.round(Math.abs(row.profit) * 100) / 100}
                max={profitPeak}
                suffix={` (${row.profit >= 0 ? "+" : "-"}${Math.abs(row.profit).toFixed(2)})`}
                tone={row.profit >= 0 ? "bull" : "bear"}
              />
            ))
          )}
        </div>
      </div>

      <div className="analytics-charts-grid">
        <div className="ctrl analytics-chart-card">
          <div className="ctrl-title">Outcome distribution</div>
          <p className="analytics-chart-sub">Win / Loss / Refund / Pending</p>
          <AnalyticsDonut segments={distributionSegments} />
          <AnalyticsStackedBar segments={distributionSegments} />
        </div>

        <div className="ctrl analytics-chart-card">
          <div className="ctrl-title">Pair-wise performance</div>
          <p className="analytics-chart-sub">Win rate by pair (verified W/L only)</p>
          {pairRates.length === 0 ? (
            <p className="analytics-empty">Not enough data yet</p>
          ) : (
            pairRates.map((p) => (
              <AnalyticsBarRow
                key={p.name}
                label={p.name}
                value={p.winRate}
                tone={
                  p.winRate >= 60 ? "bull" : p.winRate >= 45 ? "gold" : "bear"
                }
              />
            ))
          )}
        </div>

        <div className="ctrl analytics-chart-card">
          <div className="ctrl-title">Signal type performance</div>
          <p className="analytics-chart-sub">Count and win rate by signal category</p>
          {signalBuckets.every((s) => s.count === 0) ? (
            <p className="analytics-empty">Not enough data yet</p>
          ) : (
            signalBuckets.map((s) => (
              <AnalyticsBarRow
                key={s.name}
                label={`${s.name} (${s.count})`}
                value={s.winRate}
                tone={s.winRate >= 55 ? "bull" : s.winRate > 0 ? "gold" : "blue"}
              />
            ))
          )}
        </div>

        <div className="ctrl analytics-chart-card">
          <div className="ctrl-title">Loss reason breakdown</div>
          {lossBuckets.every((l) => l.count === 0) ? (
            <p className="analytics-empty">No loss reasons recorded yet</p>
          ) : (
            lossBuckets.map((l) => (
              <AnalyticsBarRow
                key={l.name}
                label={l.name}
                value={l.count}
                max={maxLoss}
                suffix=""
                tone="bear"
              />
            ))
          )}
        </div>

        <div className="ctrl analytics-chart-card">
          <div className="ctrl-title">Entry drift analysis</div>
          <div className="analytics-drift-grid">
            <div className="analytics-drift-item valid">
              <span>Valid</span>
              <strong>{summary.entryDrift.valid}</strong>
            </div>
            <div className="analytics-drift-item risky">
              <span>Risky</span>
              <strong>{summary.entryDrift.risky}</strong>
            </div>
            <div className="analytics-drift-item invalid">
              <span>Invalid</span>
              <strong>{summary.entryDrift.invalid}</strong>
            </div>
            <div className="analytics-drift-item pending">
              <span>Pending</span>
              <strong>{summary.entryDrift.pending}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="ctrl analytics-recommendations">
        <div className="ctrl-title">Recommended actions</div>
        <ol className="analytics-rec-list">
          {recommendations.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ol>
      </div>

      <div className="disclaimer-banner analytics-disclaimer">{PLATFORM_DISCLAIMER}</div>
    </div>
  );
}
