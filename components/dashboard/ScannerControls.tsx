"use client";

import {
  ALL_PAIRS,
  autoRefreshOptionsForPlan,
  getLockedPairs,
  getPlanLimits,
  planAllowsTimeframe,
  type AutoRefreshOption,
  type PlanName,
} from "@/lib/billing/planLimits";
import type { ScanSettings } from "./DashboardClient";

const AUTO_REFRESH_LABELS: Record<AutoRefreshOption, string> = {
  off: "Off",
  "180": "Every 180 sec",
  "60": "Every 60 sec",
  "30": "Every 30 sec",
};

export function ScannerControls({
  plan,
  settings,
  onChange,
  onScan,
  onRefreshPrices,
  onReloadLastScan,
  scanning,
  refreshing,
  progress,
}: {
  plan: PlanName;
  settings: ScanSettings;
  onChange: (s: Partial<ScanSettings>) => void;
  onScan: () => void;
  onRefreshPrices: () => void;
  onReloadLastScan: () => void;
  scanning: boolean;
  refreshing?: boolean;
  progress: number;
}) {
  const limits = getPlanLimits(plan);
  const locked = new Set(getLockedPairs(plan));
  const autoRefreshOptions = autoRefreshOptionsForPlan(plan);
  const can15 = planAllowsTimeframe(plan, "15min");
  const canBoth = limits.allowBothTimeframes;

  return (
    <div className="ctrl">
      <div className="ctrl-title">⚙ SIGNAL CONFIGURATION</div>
      <div className="ctrl-row">
        <div className="f">
          <label>Asset</label>
          <select
            value={settings.asset}
            onChange={(e) => onChange({ asset: e.target.value })}
          >
            <option value="all">All Major Pairs (plan)</option>
            {ALL_PAIRS.map((p) => (
              <option key={p} value={p} disabled={locked.has(p)}>
                {p}
                {locked.has(p) ? " — Pro" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="f">
          <label>Expiry Trade Time</label>
          <select
            value={settings.timeframe}
            onChange={(e) => onChange({ timeframe: e.target.value })}
          >
            <option value="5min">5 Minutes Expiry</option>
            <option value="15min" disabled={!can15}>
              15 Minutes Expiry{!can15 ? " — Upgrade" : ""}
            </option>
            <option value="both" disabled={!canBoth}>
              5 + 15 Min Expiry{!canBoth ? " — Pro" : ""}
            </option>
          </select>
        </div>
        <div className="f">
          <label>Min Score</label>
          <select
            value={settings.minScore}
            onChange={(e) => onChange({ minScore: Number(e.target.value) })}
          >
            <option value={5}>5+ Balanced</option>
            <option value={6}>6+ Quality</option>
            <option value={7}>7+ Quality</option>
            <option value={8}>8+ Precision</option>
          </select>
        </div>
        <div className="f">
          <label>Show B Signals</label>
          <select
            value={settings.showB ? "watch" : "hide"}
            onChange={(e) => onChange({ showB: e.target.value === "watch" })}
          >
            <option value="watch">Include B Watch</option>
            <option value="hide">Hide B Watch</option>
          </select>
        </div>
        <div className="f">
          <label>Session Filter</label>
          <select
            value={settings.session}
            onChange={(e) => onChange({ session: e.target.value })}
          >
            <option value="any">Any Active Session</option>
            <option value="london">London Only</option>
            <option value="overlap">NY Overlap Only</option>
            <option value="newyork">New York Only</option>
            <option value="asian">Asian Only</option>
          </select>
        </div>
        <div className="f">
          <label title="Like the HTML template: re-runs the V4 signal engine on a timer and updates live setups. Each refresh counts toward your daily scan limit.">
            Auto Refresh
          </label>
          <select
            value={settings.autoRefresh}
            onChange={(e) => onChange({ autoRefresh: e.target.value as AutoRefreshOption })}
          >
            {autoRefreshOptions.map((opt) => (
              <option key={opt} value={opt}>
                {AUTO_REFRESH_LABELS[opt]}
              </option>
            ))}
          </select>
        </div>
        <div className="f">
          <label>Trading Mode</label>
          <select
            value={settings.mode}
            onChange={(e) => onChange({ mode: e.target.value as "practice" | "live" })}
          >
            <option value="practice">Practice — Show All Signals</option>
            <option value="live">Live — Best Signal Only</option>
          </select>
        </div>
        <div className="f">
          <label>&nbsp;</label>
          <button type="button" className="btn-scan" disabled={scanning} onClick={onScan}>
            {scanning ? "SCANNING..." : "▶ SCAN MARKET"}
          </button>
        </div>
        <div className="f">
          <label>&nbsp;</label>
          <button
            type="button"
            className="btn-scan"
            style={{ background: "var(--p2)", borderColor: "var(--bd2)", color: "var(--txt2)" }}
            disabled={scanning || refreshing}
            onClick={onRefreshPrices}
            title="Run one signal scan now (same as SCAN MARKET)"
          >
            {refreshing ? "..." : "↻ REFRESH NOW"}
          </button>
        </div>
        <div className="f">
          <label>&nbsp;</label>
          <button
            type="button"
            className="btn-scan"
            style={{ background: "var(--p2)", borderColor: "var(--bd2)", color: "var(--txt2)" }}
            disabled={scanning || refreshing}
            onClick={onReloadLastScan}
            title="Reload your last scan from the server"
          >
            ↻ RELOAD LAST SCAN
          </button>
        </div>
      </div>
      <div className="progress-wrap">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
