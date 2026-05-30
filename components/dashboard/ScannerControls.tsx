"use client";

import type { ScanSettings } from "./DashboardClient";

export function ScannerControls({
  settings,
  onChange,
  onScan,
  scanning,
  progress,
}: {
  settings: ScanSettings;
  onChange: (s: Partial<ScanSettings>) => void;
  onScan: () => void;
  scanning: boolean;
  progress: number;
}) {
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
            <option value="all">All Major Pairs</option>
            <option value="EUR/USD">EUR/USD</option>
            <option value="GBP/USD">GBP/USD</option>
            <option value="USD/JPY">USD/JPY</option>
            <option value="USD/CHF">USD/CHF</option>
            <option value="AUD/USD">AUD/USD</option>
            <option value="USD/CAD">USD/CAD</option>
            <option value="NZD/USD">NZD/USD</option>
            <option value="EUR/GBP">EUR/GBP</option>
          </select>
        </div>
        <div className="f">
          <label>Expiry Trade Time</label>
          <select
            value={settings.timeframe}
            onChange={(e) => onChange({ timeframe: e.target.value })}
          >
            <option value="5min">5 Minutes Expiry</option>
            <option value="15min">15 Minutes Expiry</option>
            <option value="both">5 + 15 Min Expiry</option>
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
          <label>Auto Refresh</label>
          <select
            value={settings.autoRefresh}
            onChange={(e) => onChange({ autoRefresh: Number(e.target.value) })}
          >
            <option value={0}>Off</option>
            <option value={30}>30 sec</option>
            <option value={60}>60 sec</option>
            <option value={120}>2 min</option>
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
      </div>
      <div className="progress-wrap">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
