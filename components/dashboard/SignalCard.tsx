"use client";

import type { ComputedSignal } from "@/lib/signal-engine/types";
import { resolvePermission } from "@/lib/signal-engine/permission";
import { decimalsForPair, isJpyPair } from "@/lib/utils";
import { displayEntryTime, displayExpTime } from "./signalTime";
import { ConfRing, MiniChart } from "./MiniChart";

function signalTypeClass(type: string) {
  if (type === "STRONG FINAL") return "strong-final";
  if (type === "FINAL TRADE") return "final-trade";
  if (type === "CORRELATION RISK") return "correlation-risk";
  return "watch-only";
}

function indClass(v: string, kind: "r" | "s" | "b" | "m" | "c") {
  const n = parseFloat(v);
  if (kind === "r") return n < 35 ? "bc" : n > 65 ? "rc" : "wc";
  if (kind === "s") return n < 30 ? "bc" : n > 70 ? "rc" : "wc";
  if (kind === "b") return n < 20 ? "bc" : n > 80 ? "rc" : "wc";
  if (kind === "m") return n > 0 ? "bc" : "rc";
  return n < -100 ? "bc" : n > 100 ? "rc" : "wc";
}

export function SignalCard({
  sig,
  delay = 0,
  timeZone,
}: {
  sig: ComputedSignal;
  delay?: number;
  timeZone?: string;
}) {
  const entryDisplay = displayEntryTime(sig, timeZone);
  const expDisplay = displayExpTime(sig, timeZone);
  const dc = sig.direction === "CALL" ? "call" : "put";
  const confColor = sig.conf >= 75 ? "var(--bull)" : sig.conf >= 55 ? "var(--gold)" : "var(--warn)";
  const chgUp = parseFloat(sig.chgPct) >= 0;
  const dp = isJpyPair(sig.pair) ? 3 : 5;
  const checks = sig.checks.filter((c) => c.pass || c.weight >= 2).slice(0, 8);
  const res1 = sig.nearRes ? sig.nearRes.toFixed(dp) : "—";
  const sup1 = sig.nearSup ? sig.nearSup.toFixed(dp) : "—";
  const piv = sig.pivs.P.toFixed(dp);
  const permission = resolvePermission(sig);
  const v10Layer = sig.v10Layer;
  const v9Layer = sig.v9Layer;
  const isV10Live = v10Layer === "LIVE";
  const isV10Pending = v10Layer === "PENDING_ORDER_ELIGIBLE";
  const isV9Practice = v10Layer === "PRACTICE" || (v10Layer == null && v9Layer === "PRACTICE");
  const blocked = v10Layer === "REJECTED" || permission === "DO NOT TRADE";
  const decClass = isV10Live
    ? "allowed"
    : isV10Pending
      ? "allowed"
      : isV9Practice
        ? "observe"
        : blocked
          ? "no"
          : "observe";
  const permColor = isV10Live
    ? "var(--bull)"
    : isV10Pending
      ? "var(--blue2)"
      : isV9Practice
        ? "var(--gold2)"
        : blocked
          ? "var(--bear)"
          : "var(--gold)";
  const permLabel = isV10Live
    ? "✅ LIVE TRADE PERMISSION"
    : isV10Pending
      ? "📋 PENDING ORDER ELIGIBLE"
      : isV9Practice
        ? "🧪 PRACTICE ONLY"
        : blocked
          ? "⛔ RISK REJECTED"
          : v10Layer === "RADAR" || v9Layer === "RADAR"
            ? "📡 SETUP FORMING"
            : "⚠️ OBSERVE ONLY";
  const setupQuality = sig.setupQuality ?? sig.conf;

  return (
    <div
      className={`sc ${dc}${isV9Practice ? " practice" : ""}${isV10Live ? " v9-live" : ""}${isV10Pending ? " v10-pending" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {isV9Practice ? <div className="practice-watermark">PRACTICE ONLY</div> : null}
      <div className={`decision ${decClass}`}>
        <div>
          <div className="big" style={{ color: permColor }}>
            {permLabel}
          </div>
          <div className="small">
            {isV9Practice
              ? "Practice Signal — Demo / observation only. Not live trade permission."
              : isV10Pending
                ? `${sig.v10TimingStatus || "PENDING ORDER ELIGIBLE"} · Place pending order for planned entry time`
                : isV10Live
                  ? `${sig.v10TimingStatus || "ENTRY WINDOW OPEN"} · Valid ${sig.validUntilSec ?? "—"}s · ${sig.signalType} · gap ${sig.scoreGap}`
                  : `${sig.signalType} · ${sig.grade} grade · gap ${sig.scoreGap}`}
          </div>
        </div>
        <div className="mono" style={{ color: permColor, fontFamily: "var(--mono)" }}>
          {setupQuality}%
        </div>
      </div>
      <div className="ch">
        <div>
          <div className="ch-pair">
            {sig.pair} <span className="grade-badge">{sig.grade}</span>
          </div>
          <div className="ch-tf">
            {sig.tf.toUpperCase()} · Expiry {sig.expMin}min · Score {sig.score} · Gap {sig.scoreGap}
          </div>
        </div>
        <div className="ch-badge">{sig.direction === "CALL" ? "▲ CALL" : "▼ PUT"}</div>
      </div>
      <div className="price-row">
        <span className="price-big">{sig.price}</span>
        <span className={`price-chg ${chgUp ? "up" : "dn"}`}>
          {chgUp ? "+" : ""}
          {sig.chgPct}%
        </span>
        <span className="live-badge">LAST CLOSED CANDLE</span>
      </div>
      <div className="mini-chart">
        <MiniChart ohlc={sig.ohlc} direction={sig.direction} />
      </div>
      <div className={`signal-type-box ${signalTypeClass(sig.signalType)}`}>
        <strong>{sig.signalType}</strong> — {sig.signalReason}
        <div style={{ marginTop: 6 }}>
          <span className={`v9-badge ${Number(sig.adx) >= 22 ? "good" : Number(sig.adx) >= 16 ? "warn" : "bad"}`}>
            ADX {sig.adx}
          </span>
          <span className={`v9-badge ${sig.candleStrengthText === "STRONG" ? "good" : sig.candleStrengthText === "OK" ? "warn" : "bad"}`}>
            CANDLE {sig.candleBodyRatio}% {sig.candleStrengthText}
          </span>
          {sig.liveRank ? <span className="v9-badge good">RANK {sig.liveRank}</span> : null}
        </div>
      </div>
      <div className="score-section">
        <div className="score-header">
          <span className="score-label">Setup Quality</span>
          <span className="score-val" style={{ color: confColor }}>
            {setupQuality}% — {sig.tier}
          </span>
        </div>
        <div className="score-track">
          <div className="score-fill" style={{ width: `${sig.conf}%`, background: confColor }} />
        </div>
      </div>
      <div className="conf-row">
        <ConfRing pct={setupQuality} color={confColor} />
        <div className="conf-info">
          <div className="conf-tier" style={{ color: confColor }}>
            {sig.tier}
          </div>
          <div className="conf-desc">
            Weighted {sig.weightedScore} vs {sig.oppositeScore} · {sig.volOk ? "Active volatility" : "Low vol"} ·
            Structure: {sig.marketStructure.trend} · EMA/WMA: {sig.emaWmaBias}
          </div>
        </div>
      </div>
      <div className="checks-section">
        <div className="sec-title">Decision Checks</div>
        <div className="checks-grid">
          {checks.map((c) => (
            <div key={c.name} className={`chk ${c.pass ? "pass" : "fail"}`}>
              <span className="chk-icon">{c.pass ? "✓" : "·"}</span>
              <span>{c.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="ind-section">
        <div className="sec-title">Indicator Values</div>
        <div className="ind-grid">
          {[
            ["RSI", sig.rsi, "r"],
            ["Stoch", sig.stoch, "s"],
            ["BB %B", sig.bb, "b"],
            ["MACD", sig.macdH, "m"],
            ["CCI", sig.cci, "c"],
            ["ATR", sig.atr, "w"],
          ].map(([lbl, val, k]) => (
            <div key={lbl as string} className="ib">
              <div className="ib-lbl">{lbl as string}</div>
              <div className={`ib-val ${k !== "w" ? indClass(String(val), k as "r") : "wc"}`}>{val as string}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="sr-section">
        <div className="sec-title">Key Levels</div>
        <div className="sr-grid">
          <div className="sr-box">
            <div className="sr-tag" style={{ color: "var(--bear)" }}>
              Resistance
            </div>
            <div className="sr-val" style={{ color: "var(--bear)" }}>
              {res1}
            </div>
          </div>
          <div className="sr-box">
            <div className="sr-tag" style={{ color: "var(--warn)" }}>
              Pivot
            </div>
            <div className="sr-val" style={{ color: "var(--warn)" }}>
              {piv}
            </div>
          </div>
          <div className="sr-box">
            <div className="sr-tag" style={{ color: "var(--bull)" }}>
              Support
            </div>
            <div className="sr-val" style={{ color: "var(--bull)" }}>
              {sup1}
            </div>
          </div>
        </div>
      </div>
      <div className="pats">
        {sig.pats.length
          ? sig.pats.map((p) => (
              <span key={p.n} className={`pt ${p.d === "bull" ? "pb" : p.d === "bear" ? "pr" : ""}`}>
                {p.n}
              </span>
            ))
          : <span className="pt">No Pattern</span>}
      </div>
      {(sig.v10TimingStatus || sig.v10StrategyType || sig.htfBiasStatus) && (
        <div className="v10-meta-box">
          <div className="sec-title">V10 Permission</div>
          <div className="v10-meta-grid">
            <span>Entry: {sig.entryMethod === "manual" ? "Manual" : "Pending Order"}</span>
            <span>Timing: {sig.v10TimingStatus || "—"}</span>
            <span>Strategy: {sig.v10StrategyType || "—"}</span>
            <span>HTF: {sig.htfBiasStatus || "—"}</span>
            <span>Gap: {sig.scoreGap}</span>
            <span>ADX: {sig.adx}</span>
          </div>
          {sig.v10Blockers?.length ? (
            <div className="v10-blocker">Blocker: {sig.v10Blockers[0]}</div>
          ) : null}
        </div>
      )}
      <div className="entry-box">
        <div className="entry-col">
          <div className="el">Enter At</div>
          <div className="ev">{entryDisplay}</div>
          <div className="es">At candle open · your local time</div>
        </div>
        <div className="entry-col" style={{ textAlign: "center" }}>
          <div className="el">Expire</div>
          <div className="es">{sig.expMin} minutes</div>
          <div className="es">{expDisplay}</div>
        </div>
        <div className="entry-dir">{sig.direction === "CALL" ? "▲" : "▼"}</div>
      </div>
      <div className="reason" style={{ borderLeftColor: "var(--gold)" }}>
        <strong>Entry Safety:</strong> {sig.entryNote}
        <br />
        <span style={{ color: "var(--m2)" }}>{sig.riskNote}</span>
      </div>
      <div className="reason" dangerouslySetInnerHTML={{ __html: sig.reason }} />
    </div>
  );
}
