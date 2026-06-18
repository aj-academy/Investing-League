"use client";

import { CapitalProtectionCard } from "@/components/risk/CapitalProtectionCard";
import { formatAppDateTime } from "@/lib/datetime";
import type { RecoveryMetrics, RiskStatus } from "@/lib/risk/types";

export type AdminReportCapitalPayload = {
  startingCapital: number;
  currentCapital: number;
  todayNetProfit: number;
  consecutiveLosses: number;
  riskStatus: RiskStatus;
  liveModeLocked: boolean;
  riskPerTradePercent: number;
  dailyProfitTargetPercent: number;
  dailyLossLimitPercent: number;
  maxConsecutiveLosses: number;
  recovery: RecoveryMetrics | null;
  columnsReady: boolean;
};

export type AdminReportDailyRow = {
  trade_date: string;
  starting_capital: number;
  current_capital: number;
  total_trades: number;
  wins: number;
  losses: number;
  refunds: number;
  net_profit: number;
  consecutive_losses: number;
  live_mode_locked: boolean;
};

export type AdminReportJournalRow = {
  created_at: string;
  marked_time?: string | null;
  pair: string;
  direction?: string | null;
  timeframe?: string | null;
  scan_mode?: string | null;
  signal_type?: string | null;
  grade?: string | null;
  trade_amount?: number | null;
  payout_percent?: number | null;
  return_amount?: number | null;
  net_profit?: number | null;
  signal_entry_price?: number | null;
  olymp_opening_quote?: number | null;
  olymp_closing_quote?: number | null;
  result?: string | null;
  v9_layer?: string | null;
};

function fmt(n: number | null | undefined) {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function AdminUserReportCapital({
  capital,
  dailySummaries,
  journalEntries,
  rangeTotals,
}: {
  capital: AdminReportCapitalPayload | null;
  dailySummaries: AdminReportDailyRow[];
  journalEntries: AdminReportJournalRow[];
  rangeTotals?: {
    totalTradeAmount: number;
    totalReturnAmount: number;
    totalNetProfit: number;
  };
}) {
  if (!capital) {
    return (
      <p className="admin-page-sub" style={{ marginTop: 12 }}>
        Capital protection data unavailable. Run `capital_protection_plan.sql` in Supabase.
      </p>
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      <CapitalProtectionCard
        startingCapital={capital.startingCapital}
        currentCapital={capital.currentCapital}
        todayNetProfit={capital.todayNetProfit}
        consecutiveLosses={capital.consecutiveLosses}
        riskStatus={capital.riskStatus}
        liveModeLocked={capital.liveModeLocked}
        riskPerTradePercent={capital.riskPerTradePercent}
        dailyProfitTargetPercent={capital.dailyProfitTargetPercent}
        dailyLossLimitPercent={capital.dailyLossLimitPercent}
        maxConsecutiveLosses={capital.maxConsecutiveLosses}
        recovery={capital.recovery}
      />

      {rangeTotals && (
        <div className="journal-stats" style={{ marginTop: 12 }}>
          <div className="jstat">
            <div className="jstat-v">{fmt(rangeTotals.totalTradeAmount)}</div>
            <div className="jstat-l">Trade Amount (range)</div>
          </div>
          <div className="jstat">
            <div className="jstat-v">{fmt(rangeTotals.totalReturnAmount)}</div>
            <div className="jstat-l">Return Amount (range)</div>
          </div>
          <div className="jstat">
            <div className="jstat-v">{fmt(rangeTotals.totalNetProfit)}</div>
            <div className="jstat-l">Net P/L (range)</div>
          </div>
        </div>
      )}

      {dailySummaries.length > 0 && (
        <div className="journal-table-wrap" style={{ marginTop: 12, maxHeight: 240 }}>
          <div className="ctrl-title" style={{ marginBottom: 8, fontSize: 11 }}>
            Daily capital & discipline (by date)
          </div>
          <table className="journal-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Start Cap.</th>
                <th>End Cap.</th>
                <th>Trades</th>
                <th>W/L/R</th>
                <th>Net P/L</th>
                <th>Streak</th>
                <th>Live Lock</th>
              </tr>
            </thead>
            <tbody>
              {dailySummaries.map((d) => (
                <tr key={d.trade_date}>
                  <td>{d.trade_date}</td>
                  <td>{fmt(d.starting_capital)}</td>
                  <td>{fmt(d.current_capital)}</td>
                  <td>{d.total_trades}</td>
                  <td>
                    {d.wins}/{d.losses}/{d.refunds}
                  </td>
                  <td>{fmt(d.net_profit)}</td>
                  <td>{d.consecutive_losses}</td>
                  <td>{d.live_mode_locked ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {journalEntries.length > 0 && (
        <div className="journal-table-wrap" style={{ marginTop: 12, maxHeight: 360 }}>
          <div className="ctrl-title" style={{ marginBottom: 8, fontSize: 11 }}>
            Journal entries — amounts & quotes entered
          </div>
          <table className="journal-table admin-journal-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Pair</th>
                <th>Dir</th>
                <th>Mode</th>
                <th>V9</th>
                <th>Amount</th>
                <th>Payout</th>
                <th>Return</th>
                <th>Net</th>
                <th>Sig. Price</th>
                <th>Open</th>
                <th>Close</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {journalEntries.map((j, idx) => (
                <tr key={`${j.created_at}-${j.pair}-${idx}`}>
                  <td>{formatAppDateTime(j.marked_time || j.created_at)}</td>
                  <td>{j.pair}</td>
                  <td>{j.direction || "—"}</td>
                  <td>{j.scan_mode || "practice"}</td>
                  <td>{j.v9_layer || "—"}</td>
                  <td>{fmt(j.trade_amount)}</td>
                  <td>{j.payout_percent != null ? `${j.payout_percent}%` : "—"}</td>
                  <td>{fmt(j.return_amount)}</td>
                  <td>{fmt(j.net_profit)}</td>
                  <td>{j.signal_entry_price ?? "—"}</td>
                  <td>{j.olymp_opening_quote ?? "—"}</td>
                  <td>{j.olymp_closing_quote ?? "—"}</td>
                  <td>{j.result || "Pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
