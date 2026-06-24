"use client";

import {
  PLATFORM_DISCLAIMER,
  PLATFORM_RISK_DISCLAIMER,
} from "@/lib/platform/userCopy";
import { useState } from "react";
import { toast } from "sonner";
import { CapitalProtectionModal } from "@/components/risk/CapitalProtectionCard";
import type { RecoveryMetrics } from "@/lib/risk/types";

export function SettingsForm({
  profile,
  settings,
  email,
  capitalProfile,
}: {
  profile: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  email: string;
  capitalProfile?: Record<string, unknown> | null;
}) {
  const [fullName, setFullName] = useState(String(profile?.full_name || ""));
  const [mode, setMode] = useState(String(settings?.default_mode || "practice"));
  const [tf, setTf] = useState(String(settings?.default_timeframe || "5min"));
  const [minScore, setMinScore] = useState(Number(settings?.default_min_score || 5));
  const [showB, setShowB] = useState(Boolean(settings?.show_b_signals ?? true));
  const [accepted, setAccepted] = useState(Boolean(profile?.risk_disclaimer_accepted));
  const [saving, setSaving] = useState(false);
  const [cppOpen, setCppOpen] = useState(false);
  const [cppSaving, setCppSaving] = useState(false);
  const [recovery, setRecovery] = useState<RecoveryMetrics | null>(null);
  const [cppValues, setCppValues] = useState({
    startingCapital: Number(capitalProfile?.starting_capital) || 0,
    currentCapital: Number(capitalProfile?.current_capital) || 0,
    riskPerTradePercent: Number(capitalProfile?.risk_per_trade_percent) || 5,
    dailyProfitTargetPercent: Number(capitalProfile?.daily_profit_target_percent) || 10,
    dailyProfitTargetAmount: Number(capitalProfile?.daily_profit_target_amount) || 0,
    dailyLossLimitPercent: Number(capitalProfile?.daily_loss_limit_percent) || 15,
    maxConsecutiveLosses: Number(capitalProfile?.max_consecutive_losses) || 3,
  });

  const save = async () => {
    if (!accepted) {
      toast.error("Please check the risk disclaimer box before saving.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          riskDisclaimerAccepted: accepted,
          defaultMode: mode,
          defaultTimeframe: tf,
          defaultMinScore: minScore,
          showBSignals: showB,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Could not save settings");
        return;
      }
      if (!json.riskDisclaimerAccepted) {
        toast.error("Disclaimer was not saved. Check the box and try again.");
        return;
      }
      toast.success("Settings saved — you can run Scan Market now.");
    } catch {
      toast.error("Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  const saveCapitalPlan = async () => {
    setCppSaving(true);
    try {
      const res = await fetch("/api/capital-protection", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startingCapital: cppValues.startingCapital,
          currentCapital: cppValues.currentCapital,
          riskPerTradePercent: cppValues.riskPerTradePercent,
          dailyProfitTargetPercent: cppValues.dailyProfitTargetPercent,
          dailyProfitTargetAmount: cppValues.dailyProfitTargetAmount,
          dailyLossLimitPercent: cppValues.dailyLossLimitPercent,
          maxConsecutiveLosses: cppValues.maxConsecutiveLosses,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Could not save capital plan");
        return;
      }
      setRecovery(json.recovery || null);
      toast.success("Capital Protection Plan saved");
      if (json.warning) toast.message(json.warning);
      setCppOpen(false);
    } catch {
      toast.error("Could not save capital plan");
    } finally {
      setCppSaving(false);
    }
  };

  return (
    <div className="ctrl settings-panel" style={{ maxWidth: 560 }}>
      <div className="ctrl-title">USER PROFILE</div>
      <div className="f" style={{ marginBottom: 12 }}>
        <label>Full Name</label>
        <input
          className="key-in"
          style={{ width: "100%" }}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      <div className="f" style={{ marginBottom: 12 }}>
        <label>Email</label>
        <input className="key-in" style={{ width: "100%" }} value={email} disabled />
      </div>

      <div className="ctrl-title" style={{ marginTop: 20 }}>CAPITAL PROTECTION PLAN</div>
      <p className="cpp-plan-intro" style={{ marginBottom: 10 }}>
        Your goal is not to recover losses quickly. Your goal is to protect capital and make
        disciplined decisions.
      </p>
      <button type="button" className="jbtn" onClick={() => setCppOpen(true)}>
        Configure Capital Protection
      </button>
      <p className="cpp-disclaimer" style={{ marginTop: 10 }}>{PLATFORM_RISK_DISCLAIMER}</p>

      <div className="ctrl-title" style={{ marginTop: 20 }}>
        SCANNER DEFAULTS
      </div>
      <div className="ctrl-row">
        <div className="f">
          <label>Default Mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="practice">Practice</option>
            <option value="live">Live</option>
          </select>
        </div>
        <div className="f">
          <label>Default Timeframe</label>
          <select value={tf} onChange={(e) => setTf(e.target.value)}>
            <option value="5min">5min</option>
            <option value="15min">15min</option>
          </select>
        </div>
        <div className="f">
          <label>Min Score</label>
          <select value={minScore} onChange={(e) => setMinScore(Number(e.target.value))}>
            {[5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </div>
        <div className="f">
          <label>Show B Signals</label>
          <select value={showB ? "yes" : "no"} onChange={(e) => setShowB(e.target.value === "yes")}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>
      <div className="ctrl-title" style={{ marginTop: 20 }}>
        RISK DISCLAIMER
      </div>
      <label style={{ display: "flex", gap: 8, fontSize: 10, color: "var(--m3)", marginBottom: 16 }}>
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        <span>{PLATFORM_DISCLAIMER}</span>
      </label>
      <button type="button" className="btn-scan" onClick={save} disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </button>

      <CapitalProtectionModal
        open={cppOpen}
        saving={cppSaving}
        values={cppValues}
        recovery={recovery}
        onChange={(patch) => setCppValues((s) => ({ ...s, ...patch }))}
        onSave={() => void saveCapitalPlan()}
        onClose={() => setCppOpen(false)}
      />
    </div>
  );
}
