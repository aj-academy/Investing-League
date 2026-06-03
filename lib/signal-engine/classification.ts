import { M } from "./indicators";
import { historyFinals } from "./cooldown";
import { applyPermission } from "./permission";
import type { ComputedSignal, JournalHistoryRow, OHLC, SignalType, TradingMode } from "./types";

export const V4 = {
  minFinalConf: 68,
  minStrongConf: 78,
  minFinalScore: 7,
  minStrongScore: 8,
  adx5: 16,
  adx15: 18,
  strongAdx: 22,
  minBody: 28,
  strongBody: 38,
  maxBody: 82,
  cooldown5: 10,
  cooldown15: 30,
  exhaustAfterFinalTrades: 2,
};

function candleStats(ohlc: OHLC[]) {
  const i = ohlc.length - 2;
  const c = ohlc[i];
  const range = Math.max(c.high - c.low, 1e-10);
  const body = Math.abs(c.close - c.open);
  const upper = c.high - Math.max(c.open, c.close);
  const lower = Math.min(c.open, c.close) - c.low;
  return {
    bodyRatio: (body / range) * 100,
    bullish: c.close > c.open,
    bearish: c.close < c.open,
    upperWick: (upper / range) * 100,
    lowerWick: (lower / range) * 100,
    closePos: ((c.close - c.low) / range) * 100,
  };
}

export function enrichWithV4Metrics(sig: ComputedSignal, ohlc: OHLC[]) {
  const i = ohlc.length - 2;
  const adxArr = M.adx(ohlc, 14);
  const adxVal = adxArr[i];
  const cs = candleStats(ohlc);
  sig.adx = Number.isFinite(adxVal as number) ? Number((adxVal as number).toFixed(1)) : 0;
  sig.candleBodyRatio = Number(cs.bodyRatio.toFixed(1));
  sig.candleBullish = cs.bullish;
  sig.candleBearish = cs.bearish;
  sig.candleStrengthText =
    sig.candleBodyRatio < V4.minBody
      ? "WEAK"
      : sig.candleBodyRatio > V4.maxBody
        ? "TOO LARGE"
        : sig.candleBodyRatio >= V4.strongBody
          ? "STRONG"
          : "OK";
  return sig;
}

export function classifyV4(
  sig: ComputedSignal,
  mode: TradingMode,
  journalHistory: JournalHistoryRow[] = []
): ComputedSignal {
  const conf = Number(sig.conf || 0);
  const score = Number(sig.score || 0);
  const grade = String(sig.grade || "B");
  const adxNeed = sig.tf === "15min" ? V4.adx15 : V4.adx5;
  const aligned =
    sig.direction === "CALL"
      ? sig.emaBullTrend && sig.wmaBullTrend
      : sig.emaBearTrend && sig.wmaBearTrend;
  const trendMom =
    sig.direction === "CALL" ? sig.trendMomentumBull : sig.trendMomentumBear;
  const late =
    (sig.direction === "CALL" && sig.overExtendedBull) ||
    (sig.direction === "PUT" && sig.overExtendedBear) ||
    sig.bigCandle;
  const candleOk =
    Number(sig.candleBodyRatio || 0) >= V4.minBody &&
    Number(sig.candleBodyRatio || 0) <= V4.maxBody;
  const candleDirOk =
    sig.direction === "CALL" ? sig.candleBullish : sig.candleBearish;
  const adxOk = Number(sig.adx || 0) >= adxNeed;
  const h = historyFinals(sig, journalHistory);

  let type: SignalType = "FINAL TRADE";
  let reason = "Fresh clean setup. Enter only near candle open and record Olymp quotes.";

  if (grade === "B") {
    type = "WATCH ONLY";
    reason = "B-grade is observation only.";
  } else if (conf < V4.minFinalConf) {
    type = "WATCH ONLY";
    reason = "Confidence below final threshold.";
  } else if (score < V4.minFinalScore) {
    type = "WATCH ONLY";
    reason = "Score below final threshold.";
  } else if (!aligned) {
    type = "WATCH ONLY";
    reason = "EMA/WMA direction is not fully aligned.";
  } else if (!adxOk) {
    type = "WATCH ONLY";
    reason = "ADX trend strength is weak. Market may be sideways.";
  } else if (!candleOk || !candleDirOk) {
    type = "WATCH ONLY";
    reason = "Candle close strength is not good enough for binary entry.";
  } else if (late) {
    type = "LATE ENTRY";
    reason = "Move looks extended or candle is too large. Avoid chasing.";
  } else if (h.clusterFinal.length >= V4.exhaustAfterFinalTrades) {
    type = "TREND EXHAUSTED";
    reason =
      "Multiple final trades already appeared in this direction. Avoid chasing trend tail.";
  } else if (h.recentFinal.length > 0) {
    type = "REPEATED SIGNAL";
    reason = "A final trade already appeared recently for this pair/direction.";
  } else if (
    grade === "A+" &&
    conf >= V4.minStrongConf &&
    score >= V4.minStrongScore &&
    Number(sig.adx || 0) >= V4.strongAdx &&
    Number(sig.candleBodyRatio || 0) >= V4.strongBody &&
    trendMom
  ) {
    type = "STRONG FINAL";
    reason =
      "Strong trend, ADX strength, candle body, momentum, and fresh entry aligned.";
  }

  sig.signalType = type;
  sig.signalReason = reason;
  sig.tradeEligible = type === "FINAL TRADE" || type === "STRONG FINAL";
  sig.mode = mode;
  return applyPermission(sig);
}
