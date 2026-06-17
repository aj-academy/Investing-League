"use client";

import { RISK_DISCLAIMER } from "@/lib/risk/capitalProtection";
import type { RecoveryMetrics, RiskStatus } from "@/lib/risk/types";

function riskClass(status: RiskStatus) {
  if (status === "stop") return "cpp-risk-stop";
  if (status === "caution") return "cpp-risk-caution";
  return "cpp-risk-normal";
}

function riskLabel(status: RiskStatus) {
  if (status === "stop") return "Stop Trading";
  if (status === "caution") return "Caution";
  return "Normal";
}

export function CapitalProtectionCard({
  startingCapital,
  currentCapital,
  todayNetProfit,
  consecutiveLosses,
  riskStatus,
  liveModeLocked,
  onEdit,
}: {
  startingCapital: number;
  currentCapital: number;
  todayNetProfit: number;
  consecutiveLosses: number;
  riskStatus: RiskStatus;
  liveModeLocked: boolean;
  onEdit?: () => void;
}) {
  return (
    <div className="ctrl cpp-card">
      <div className="cpp-card-head">
        <div className="ctrl-title">Capital Protection</div>
        {onEdit && (
          <button type="button" className="jbtn" onClick={onEdit}>
            Edit plan
          </button>
        )}
      </div>
      <div className="journal-stats cpp-stats">
        <div className="jstat">
          <div className="jstat-v">{startingCapital.toFixed(2)}</div>
          <div className="jstat-l">Starting Capital</div>
        </div>
        <div className="jstat">
          <div className="jstat-v">{currentCapital.toFixed(2)}</div>
          <div className="jstat-l">Current Capital</div>
        </div>
        <div className="jstat">
          <div
            className="jstat-v"
            style={{
              color: todayNetProfit >= 0 ? "var(--bull)" : "var(--bear)",
            }}
          >
            {todayNetProfit.toFixed(2)}
          </div>
          <div className="jstat-l">Today P/L</div>
        </div>
        <div className="jstat">
          <div className="jstat-v">{consecutiveLosses}</div>
          <div className="jstat-l">Loss Streak</div>
        </div>
        <div className="jstat">
          <div className={`jstat-v ${riskClass(riskStatus)}`}>{riskLabel(riskStatus)}</div>
          <div className="jstat-l">Risk Status</div>
        </div>
        <div className="jstat">
          <div className="jstat-v" style={{ color: liveModeLocked ? "var(--bear)" : "var(--bull)" }}>
            {liveModeLocked ? "Paused" : "Active"}
          </div>
          <div className="jstat-l">Live Mode</div>
        </div>
      </div>
    </div>
  );
}

export function CapitalProtectionModal({
  open,
  saving,
  values,
  recovery,
  onChange,
  onSave,
  onClose,
}: {
  open: boolean;
  saving: boolean;
  values: {
    startingCapital: number;
    currentCapital: number;
    riskPerTradePercent: number;
    dailyProfitTargetPercent: number;
    dailyLossLimitPercent: number;
    maxConsecutiveLosses: number;
  };
  recovery: RecoveryMetrics | null;
  onChange: (patch: Partial<typeof values>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,12,.85)",
        zIndex: 1550,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="ctrl cpp-modal"
        style={{ width: "min(560px, 96vw)", maxHeight: "90vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ctrl-title">Capital Protection Plan</div>
        <p className="cpp-plan-intro">
          Your goal is not to recover losses quickly. Your goal is to protect capital and make
          disciplined decisions.
        </p>
        <div className="cpp-form-grid">
          <div className="f">
            <label>Starting Capital</label>
            <input
              className="key-in"
              type="number"
              min={0}
              step="0.01"
              value={values.startingCapital}
              onChange={(e) => onChange({ startingCapital: Number(e.target.value) })}
            />
          </div>
          <div className="f">
            <label>Current Capital</label>
            <input
              className="key-in"
              type="number"
              min={0}
              step="0.01"
              value={values.currentCapital}
              onChange={(e) => onChange({ currentCapital: Number(e.target.value) })}
            />
          </div>
          <div className="f">
            <label>Risk per Trade %</label>
            <input
              className="key-in"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={values.riskPerTradePercent}
              onChange={(e) => onChange({ riskPerTradePercent: Number(e.target.value) })}
            />
          </div>
          <div className="f">
            <label>Daily Profit Target %</label>
            <input
              className="key-in"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={values.dailyProfitTargetPercent}
              onChange={(e) => onChange({ dailyProfitTargetPercent: Number(e.target.value) })}
            />
          </div>
          <div className="f">
            <label>Daily Loss Limit %</label>
            <input
              className="key-in"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={values.dailyLossLimitPercent}
              onChange={(e) => onChange({ dailyLossLimitPercent: Number(e.target.value) })}
            />
          </div>
          <div className="f">
            <label>Stop After Consecutive Losses</label>
            <input
              className="key-in"
              type="number"
              min={1}
              max={20}
              step={1}
              value={values.maxConsecutiveLosses}
              onChange={(e) => onChange({ maxConsecutiveLosses: Number(e.target.value) })}
            />
          </div>
        </div>
        {recovery?.message && (
          <div className="cpp-recovery-warn">{recovery.message}</div>
        )}
        <p className="cpp-disclaimer">{RISK_DISCLAIMER}</p>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button type="button" className="btn-scan" disabled={saving} onClick={onSave}>
            {saving ? "Saving..." : "Save Plan"}
          </button>
          <button type="button" className="jbtn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
