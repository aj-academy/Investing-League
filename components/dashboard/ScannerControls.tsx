"use client";

import {
  autoRefreshOptionsForPlan,
  type AutoRefreshOption,
  type PlanName,
} from "@/lib/billing/planLimits";
import type { MinGradeFilter } from "@/lib/signal-engine/permission";
import type { ScanSettings } from "./DashboardClient";
import { SoundControls } from "./SoundControls";

const AUTO_REFRESH_LABELS: Record<AutoRefreshOption, string> = {
  "60": "Every 60 sec",
  "120": "Every 2 min",
  "300": "Every 5 min",
  off: "Manual Only",
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
  const autoRefreshOptions = autoRefreshOptionsForPlan(plan);

  return (
    <>
      <div className="box key-box">
        <div className="key-top">
          <h3>🔔 SIGNAL ALERTS</h3>
          <span className="badge">V8 · TRADE ALLOWED only</span>
        </div>
        <SoundControls />
        <div className="risk" style={{ marginTop: 8 }}>
          Educational decision-support only. Alerts play once per new STRONG FINAL / FINAL TRADE per day.
        </div>
      </div>

      <div className="ctrl">
        <div className="ctrl-title">⚙ SIGNAL CONFIGURATION</div>
        <div className="ctrl-row">
          <div className="f">
            <label>Mode</label>
            <select
              value={settings.mode}
              onChange={(e) => onChange({ mode: e.target.value as "practice" | "live" })}
            >
              <option value="practice">Practice · Show All</option>
              <option value="live">Live · Best Signal Only</option>
            </select>
          </div>
          <div className="f">
            <label>Expiry</label>
            <select
              value={settings.timeframe}
              onChange={(e) => onChange({ timeframe: e.target.value })}
            >
              <option value="5min">5-min expiry</option>
              <option value="15min">15-min expiry</option>
              <option value="both">5 + 15-min</option>
            </select>
          </div>
          <div className="f">
            <label>Min Grade</label>
            <select
              value={settings.minGrade}
              onChange={(e) => onChange({ minGrade: e.target.value as MinGradeFilter })}
            >
              <option value="B">B+ Watch</option>
              <option value="A">A and A+</option>
              <option value="A+">A+ only</option>
            </select>
          </div>
          <div className="f">
            <label>Session Filter</label>
            <select
              value={settings.session}
              onChange={(e) => onChange({ session: e.target.value })}
            >
              <option value="any">Any Liquid Session</option>
              <option value="london">London</option>
              <option value="newyork">New York</option>
              <option value="overlap">London + NY Overlap</option>
            </select>
          </div>
          <div className="f">
            <label title="Re-runs full signal engine on a timer. Each refresh counts toward daily scan limit.">
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
            <label>&nbsp;</label>
            <button type="button" className="btn-scan" disabled={scanning} onClick={onScan}>
              {scanning ? "SCANNING..." : "▶ SCAN SELECTED"}
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
            >
              ↻ RELOAD LAST SCAN
            </button>
          </div>
        </div>
        <div className="progress-wrap">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="msg warn show scan-note-v8">
          V8 rule: Grade is setup quality. Trade permission is only the big box: TRADE ALLOWED /
          OBSERVE ONLY / DO NOT TRADE.
        </div>
      </div>
    </>
  );
}
