"use client";

import {
  autoRefreshOptionsForPlan,
  expiryOptionsForPlan,
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
  off: "Manual only",
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
  filtersLocked,
  progress,
  selectedPairCount = 0,
}: {
  plan: PlanName;
  settings: ScanSettings;
  onChange: (s: Partial<ScanSettings>) => void;
  onScan: () => void;
  onRefreshPrices: () => void;
  onReloadLastScan: () => void;
  scanning: boolean;
  refreshing?: boolean;
  filtersLocked?: boolean;
  progress: number;
  selectedPairCount?: number;
}) {
  const lockFilters = Boolean(filtersLocked || scanning);
  const autoRefreshOptions = autoRefreshOptionsForPlan(plan);
  const expiryOptions = expiryOptionsForPlan(plan);
  const tfLabel =
    expiryOptions.find((o) => o.value === settings.timeframe)?.label ?? settings.timeframe;

  return (
    <div className="scanner-config">
      <div className="scanner-config-head">
        <div>
          <h3 className="scanner-config-title">Signal configuration</h3>
          <p className="scanner-config-sub">Tune filters before you run the engine</p>
        </div>
        <div className="scanner-sound-compact">
          <span className="scanner-sound-label">Alerts</span>
          <SoundControls />
        </div>
      </div>

      <div className="scanner-mode-row">
        <span className="scanner-field-label">Trading mode</span>
        <div className="scanner-mode-pills">
          <button
            type="button"
            className={`scanner-mode-pill${settings.mode === "practice" ? " on" : ""}`}
            disabled={lockFilters}
            onClick={() => onChange({ mode: "practice" })}
          >
            <span className="scanner-mode-icon">📚</span>
            Practice
            <span className="scanner-mode-hint">All setups</span>
          </button>
          <button
            type="button"
            className={`scanner-mode-pill live${settings.mode === "live" ? " on" : ""}`}
            disabled={lockFilters}
            onClick={() => onChange({ mode: "live" })}
          >
            <span className="scanner-mode-icon">🎯</span>
            Live
            <span className="scanner-mode-hint">Best signal</span>
          </button>
        </div>
      </div>

      <div className="scanner-filters-grid">
        <div className="scanner-field">
          <label>Expiry</label>
          <select
            value={settings.timeframe}
            disabled={lockFilters}
            onChange={(e) => onChange({ timeframe: e.target.value })}
          >
            {expiryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="scanner-field">
          <label>Min grade</label>
          <select
            value={settings.minGrade}
            disabled={lockFilters}
            onChange={(e) => onChange({ minGrade: e.target.value as MinGradeFilter })}
          >
            <option value="B">B+ Watch</option>
            <option value="A">A and A+</option>
            <option value="A+">A+ only</option>
          </select>
        </div>
        <div className="scanner-field">
          <label>Session</label>
          <select
            value={settings.session}
            disabled={lockFilters}
            onChange={(e) => onChange({ session: e.target.value })}
          >
            <option value="any">Any liquid</option>
            <option value="london">London</option>
            <option value="newyork">New York</option>
            <option value="overlap">NY overlap</option>
          </select>
        </div>
        <div className="scanner-field">
          <label>Daily trade cap</label>
          <select
            value={String(settings.dailyTradeLimit)}
            disabled={lockFilters}
            onChange={(e) => onChange({ dailyTradeLimit: Number(e.target.value) })}
          >
            <option value={3}>3 trades</option>
            <option value={5}>5 trades</option>
            <option value={8}>8 trades</option>
            <option value={999}>No limit</option>
          </select>
        </div>
        <div className="scanner-field">
          <label title="Each refresh counts toward your daily scan limit.">
            Auto refresh
          </label>
          <select
            value={settings.autoRefresh}
            disabled={lockFilters}
            onChange={(e) => onChange({ autoRefresh: e.target.value as AutoRefreshOption })}
          >
            {autoRefreshOptions.map((opt) => (
              <option key={opt} value={opt}>
                {AUTO_REFRESH_LABELS[opt]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="scanner-action-bar">
        <div className="scanner-action-main">
          <button
            type="button"
            className={`scanner-btn-run${scanning ? " scanning" : ""}`}
            disabled={scanning || selectedPairCount === 0}
            onClick={onScan}
          >
            <span className="scanner-btn-run-icon">{scanning ? "◉" : "▶"}</span>
            {scanning ? "Scanning market…" : "Run scan"}
          </button>
          <p className="scanner-action-hint">
            {selectedPairCount > 0
              ? `${selectedPairCount} asset(s) · ${tfLabel} · counts toward daily quota`
              : "Select at least one asset above to scan"}
          </p>
        </div>
        <div className="scanner-action-secondary">
          <button
            type="button"
            className="scanner-btn-secondary"
            disabled={scanning || refreshing}
            onClick={onRefreshPrices}
          >
            {refreshing ? "Refreshing…" : "↻ Refresh"}
          </button>
          <button
            type="button"
            className="scanner-btn-secondary"
            disabled={scanning || refreshing}
            onClick={onReloadLastScan}
          >
            ↻ Last scan
          </button>
        </div>
      </div>

      <div className="scanner-progress-wrap">
        <div className="scanner-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="scanner-tip">
        <span className="scanner-tip-icon">💡</span>
        Grade = setup quality. Permission box = <strong>TRADE ALLOWED</strong>,{" "}
        <strong>OBSERVE ONLY</strong>, or <strong>DO NOT TRADE</strong>.
      </div>
    </div>
  );
}
