"use client";

import type { ComputedSignal } from "@/lib/signal-engine/types";
import type { V10Permission } from "@/lib/signal-engine/v10/types";

function badgeStyle(permission?: V10Permission) {
  switch (permission) {
    case "TRADE_ALLOWED":
      return { color: "var(--bull)", bg: "rgba(34,197,94,0.12)", label: "TRADE ALLOWED — Strongest setup now" };
    case "PENDING_ORDER_SIGNAL":
      return {
        color: "var(--blue2)",
        bg: "rgba(59,130,246,0.12)",
        label: "PENDING ORDER SIGNAL — Final validation required",
      };
    case "CAUTION_SIGNAL":
      return {
        color: "var(--gold2)",
        bg: "rgba(234,179,8,0.12)",
        label: "CAUTION SIGNAL — Practice / observe only",
      };
    default:
      return {
        color: "var(--m3)",
        bg: "rgba(148,163,184,0.12)",
        label: "AVOID TRADE — Weak market condition",
      };
  }
}

export function BestSignalsNow({ signals }: { signals: ComputedSignal[] }) {
  if (!signals.length) {
    return (
      <div className="best-signals-empty">
        <h3 className="best-signals-title">BEST SIGNALS NOW</h3>
        <p>
          No strong trade setup now. Market scanned successfully. Waiting for better momentum.
        </p>
      </div>
    );
  }

  return (
    <div className="best-signals-wrap">
      <h3 className="best-signals-title">BEST SIGNALS NOW</h3>
      <div className="best-signals-grid">
        {signals.map((sig) => {
          const badge = badgeStyle(sig.v10Permission);
          return (
            <div
              key={sig.signalUid}
              className={`best-signal-card ${sig.direction === "CALL" ? "call" : "put"}`}
            >
              <div className="best-signal-head">
                <span className="best-signal-pair">
                  #{sig.liveRank ?? "—"} {sig.pair} {sig.direction}
                </span>
                <span className="best-signal-tf">{sig.tf}</span>
              </div>
              <div
                className="best-signal-badge"
                style={{ color: badge.color, background: badge.bg }}
              >
                {sig.v10Label || badge.label}
              </div>
              <div className="best-signal-metrics">
                <span>Quality {sig.v10Quality ?? sig.conf}%</span>
                <span>Gap {sig.scoreGap}</span>
                <span>ADX {sig.adx}</span>
                {sig.v10StrategyType ? <span>{sig.v10StrategyType}</span> : null}
              </div>
              <p className="best-signal-reason">{sig.signalReason || sig.reason}</p>
              <p className="best-signal-action">{sig.v10Action || sig.entryNote}</p>
              {sig.v10Warnings?.length ? (
                <p className="best-signal-warn">⚠ {sig.v10Warnings.join(" · ")}</p>
              ) : null}
              {sig.v10Blockers?.length ? (
                <p className="best-signal-block">⛔ {sig.v10Blockers.join(" · ")}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
