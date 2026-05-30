"use client";

import { createClient } from "@/lib/supabase/client";
import { DISCLAIMER } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

export function SettingsForm({
  profile,
  settings,
  isDemo = false,
}: {
  profile: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  isDemo?: boolean;
}) {
  const [fullName, setFullName] = useState(String(profile?.full_name || ""));
  const [mode, setMode] = useState(String(settings?.default_mode || "practice"));
  const [tf, setTf] = useState(String(settings?.default_timeframe || "5min"));
  const [minScore, setMinScore] = useState(Number(settings?.default_min_score || 5));
  const [showB, setShowB] = useState(Boolean(settings?.show_b_signals ?? true));
  const [accepted, setAccepted] = useState(Boolean(profile?.risk_disclaimer_accepted));

  const save = async () => {
    if (isDemo) {
      toast.success("Demo mode — settings are not persisted until Supabase is connected.");
      return;
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        risk_disclaimer_accepted: accepted,
        disclaimer_accepted_at: accepted ? new Date().toISOString() : null,
      })
      .eq("id", user.id);

    await supabase.from("user_settings").upsert({
      user_id: user.id,
      default_mode: mode,
      default_timeframe: tf,
      default_min_score: minScore,
      show_b_signals: showB,
    });

    toast.success("Settings saved");
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
        <input className="key-in" style={{ width: "100%" }} value={String(profile?.email || "")} disabled />
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
      <div className="ctrl-title">SUBSCRIPTION</div>
      <p style={{ fontSize: 11, color: "var(--m3)", marginBottom: 12 }}>
        Plan: {String(profile?.plan || "free")} (placeholder for commercial billing)
      </p>
      <button type="button" className="btn-scan" onClick={save}>
        Save Settings
      </button>
    </div>
  );
}
