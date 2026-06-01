"use client";

import { getPlanLimits, getUserPlan, type PlanName } from "@/lib/billing/planLimits";
import { DISCLAIMER } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function SettingsForm({
  profile,
  settings,
  email,
  plan: planProp,
}: {
  profile: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  email: string;
  plan?: PlanName;
}) {
  const plan = planProp ?? getUserPlan(profile as { plan?: string; role?: string });
  const limits = getPlanLimits(plan);
  const router = useRouter();
  const [fullName, setFullName] = useState(String(profile?.full_name || ""));
  const [mode, setMode] = useState(String(settings?.default_mode || "practice"));
  const [tf, setTf] = useState(String(settings?.default_timeframe || "5min"));
  const [minScore, setMinScore] = useState(Number(settings?.default_min_score || 5));
  const [showB, setShowB] = useState(Boolean(settings?.show_b_signals ?? true));
  const [accepted, setAccepted] = useState(Boolean(profile?.risk_disclaimer_accepted));
  const [saving, setSaving] = useState(false);

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
      router.refresh();
    } catch {
      toast.error("Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ctrl" style={{ maxWidth: 520 }}>
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
        <span>{DISCLAIMER}</span>
      </label>
      <div className="ctrl-title">SUBSCRIPTION PLAN</div>
      <div style={{ fontSize: 11, color: "var(--m3)", marginBottom: 12, lineHeight: 1.7 }}>
        <div>
          <strong style={{ color: "var(--txt2)" }}>Current plan:</strong> {limits.label}
        </div>
        <div>
          <strong style={{ color: "var(--txt2)" }}>Pairs:</strong>{" "}
          {limits.allowedPairs.join(", ")}
        </div>
        <div>
          <strong style={{ color: "var(--txt2)" }}>Daily scans:</strong> {limits.dailyScanLimit}
        </div>
        <div>
          <strong style={{ color: "var(--txt2)" }}>Timeframes:</strong>{" "}
          {limits.allowBothTimeframes
            ? "5min, 15min, both"
            : limits.allowedTimeframes.join(", ")}
        </div>
        <div>
          <strong style={{ color: "var(--txt2)" }}>Auto refresh:</strong>{" "}
          {limits.allowAutoScan
            ? "Available on Scanner (Off / 60s / 180s / 30s by plan)"
            : "Not available on this plan"}
        </div>
        <p style={{ marginTop: 8, fontSize: 10 }}>
          Stripe billing integration coming soon. Admins can change plans from the Admin page.
        </p>
      </div>
      <button type="button" className="btn-scan" onClick={save} disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
