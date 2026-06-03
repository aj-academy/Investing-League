import type { ComputedSignal, TradingMode } from "../types";
import { buildV8SignalUid, computeV8Raw, type V8RawSignal } from "./compute";

const EMPTY_STRUCTURE = {
  trend: "neutral" as const,
  bullishBOS: false,
  bearishBOS: false,
  lastSwingHigh: null,
  lastSwingLow: null,
  structureScore: 0,
};

export function v8RawToComputed(raw: V8RawSignal, mode: TradingMode): ComputedSignal {
  const tradeEligible =
    raw.permission === "TRADE ALLOWED" &&
    (raw.type === "FINAL TRADE" || raw.type === "STRONG FINAL");

  const checks = raw.checks.map(([name, pass, weight]) => ({ name, pass, weight }));
  const bullChecks = raw.direction === "CALL" ? checks : [];
  const bearChecks = raw.direction === "PUT" ? checks : [];

  const candleStrengthText =
    raw.candle.bodyRatio < 28
      ? "WEAK"
      : raw.candle.bodyRatio > 78
        ? "TOO LARGE"
        : raw.candle.bodyRatio >= 38
          ? "STRONG"
          : "OK";

  return {
    pair: raw.pair,
    direction: raw.direction,
    tf: raw.tf,
    score: raw.score,
    conf: raw.conf,
    tier: raw.grade,
    grade: raw.grade,
    scoreGap: raw.gap,
    weightedScore: raw.score,
    oppositeScore: raw.opp,
    category: { trend: 0, momentum: 0, volatility: 0, sr: 0, candle: 0 },
    marketStructure: EMPTY_STRUCTURE,
    emaWmaBias:
      raw.emaBullTrend && raw.wmaBullTrend
        ? "Bullish"
        : raw.emaBearTrend && raw.wmaBearTrend
          ? "Bearish"
          : "Mixed",
    emaBullTrend: raw.emaBullTrend,
    emaBearTrend: raw.emaBearTrend,
    wmaBullTrend: raw.wmaBullTrend,
    wmaBearTrend: raw.wmaBearTrend,
    emaBullCross: false,
    emaBearCross: false,
    wmaBullCross: false,
    wmaBearCross: false,
    trendMomentumBull: raw.emaBullTrend && raw.wmaBullTrend,
    trendMomentumBear: raw.emaBearTrend && raw.wmaBearTrend,
    overExtendedBull: raw.overExtendedBull,
    overExtendedBear: raw.overExtendedBear,
    bigCandle: raw.bigCandle,
    price: String(raw.price),
    chgPct: String(raw.chgPct),
    entryTime: raw.entryTime,
    expTime: raw.expiryTime,
    entryAtIso: raw.entryAtIso,
    expAtIso: raw.expAtIso,
    expMin: raw.expiryMin,
    maxEntryDrift: raw.pair.includes("JPY") ? "0.030" : "0.00010",
    entryNote: "Enter near candle open · verify platform quote",
    riskNote: raw.blockers.join(" · ") || raw.reason,
    rsi: String(raw.rsi),
    stoch: String(raw.stoch),
    cci: String(raw.cci),
    bb: `${Math.round(raw.bbPB * 100)}%`,
    macdH: String(raw.macdH),
    atr: String(raw.atr),
    bullChecks,
    bearChecks,
    checks,
    pats: raw.pats,
    pivs: raw.pivs,
    nearRes: raw.nearRes,
    nearSup: raw.nearSup,
    volOk: raw.atrOk && raw.spreadOk,
    sidewaysMarket: raw.adx < 12,
    emaCompression: 0,
    reason: raw.reason,
    ohlc: raw.ohlc,
    signalUid: buildV8SignalUid(raw),
    signalType: raw.type,
    signalReason: raw.reason,
    permission: raw.permission,
    tradeEligible,
    mode,
    adx: raw.adx,
    candleBodyRatio: raw.candle.bodyRatio,
    candleBullish: raw.candle.bull,
    candleBearish: raw.candle.bear,
    candleStrengthText,
  };
}

export function computeV8Signal(
  ohlc: Parameters<typeof computeV8Raw>[0],
  pair: string,
  tf: string,
  mode: TradingMode,
  timeZone?: string
): ComputedSignal | null {
  const raw = computeV8Raw(ohlc, pair, tf, timeZone);
  if (!raw) return null;
  return v8RawToComputed(raw, mode);
}
