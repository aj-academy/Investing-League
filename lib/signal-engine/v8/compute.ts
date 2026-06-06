import { formatAppDateSlash, formatAppTime, resolveTimeZone } from "@/lib/datetime";
import { decimalsForPair } from "@/lib/utils";
import { M } from "../indicators";
import type {
  Direction,
  OHLC,
  Pattern,
  SignalType,
  TradePermission,
} from "../types";
import { V8_CONFIG } from "./config";
import { detectPatternsV8 } from "./patterns";

export type V8CheckTuple = [string, boolean, number];

export interface V8CandleStats {
  body: number;
  bodyRatio: number;
  bull: boolean;
  bear: boolean;
}

export interface V8RawSignal {
  pair: string;
  tf: string;
  expiryMin: number;
  direction: Direction;
  score: number;
  gap: number;
  opp: number;
  conf: number;
  grade: string;
  permission: TradePermission;
  type: SignalType;
  reason: string;
  price: number;
  chgPct: number;
  entryDate: string;
  entryTime: string;
  expiryTime: string;
  entryAtIso: string;
  expAtIso: string;
  rsi: number;
  stoch: number;
  cci: number;
  bbPB: number;
  macdH: number;
  atr: number;
  adx: number;
  pivs: { R2: number; R1: number; P: number; S1: number; S2: number };
  nearRes?: number;
  nearSup?: number;
  checks: V8CheckTuple[];
  blockers: string[];
  pats: Pattern[];
  candle: V8CandleStats;
  ohlc: OHLC[];
  emaBullTrend: boolean;
  emaBearTrend: boolean;
  wmaBullTrend: boolean;
  wmaBearTrend: boolean;
  movingConflict: boolean;
  overExtendedBull: boolean;
  overExtendedBear: boolean;
  bigCandle: boolean;
  atrOk: boolean;
  spreadOk: boolean;
}

function candleStats(c: OHLC): V8CandleStats {
  const range = Math.max(c.high - c.low, 1e-10);
  const body = Math.abs(c.close - c.open);
  return {
    body,
    bodyRatio: (body / range) * 100,
    bull: c.close > c.open,
    bear: c.close < c.open,
  };
}

function nextCandleTime(interval: string, asOf = Date.now()) {
  const ms = parseInt(interval, 10) * 60_000;
  return new Date(Math.ceil(asOf / ms) * ms);
}

function formatTime(d: Date, timeZone: string) {
  return formatAppTime(d, timeZone);
}

function formatDate(d: Date, timeZone: string) {
  return formatAppDateSlash(d, timeZone);
}

/** V8 HTML computeSignal — clean decision pipeline. */
export function computeV8Raw(
  ohlc: OHLC[],
  pair: string,
  tf: string,
  timeZone?: string,
  asOf?: Date
): V8RawSignal | null {
  if (ohlc.length < 90) return null;

  const tz = resolveTimeZone(timeZone);
  const c = ohlc.map((x) => x.close);
  const n = c.length;
  const i = n - 2;
  const price = c[i];
  const prev = c[i - 1];
  const is5 = tf === "5min";
  const jpy = pair.includes("JPY");

  const e9 = M.ema(c, 9);
  const e21 = M.ema(c, 21);
  const e50 = M.ema(c, 50);
  const w5 = M.wma(c, 5);
  const w20 = M.wma(c, 20);

  if ([w5[i], w20[i], e9[i], e21[i], e50[i]].some((v) => v == null || !Number.isFinite(v as number)))
    return null;

  const emaBullTrend = e9[i]! > e21[i]! && e21[i]! > e50[i]!;
  const emaBearTrend = e9[i]! < e21[i]! && e21[i]! < e50[i]!;
  const wmaBullTrend = w5[i]! > w20[i]!;
  const wmaBearTrend = w5[i]! < w20[i]!;
  const movingConflict = (emaBullTrend && wmaBearTrend) || (emaBearTrend && wmaBullTrend);

  const rsiArr = M.rsi(c, is5 ? 9 : 14);
  const rsiV = rsiArr[i] as number;
  const rsiP = rsiArr[i - 1] as number;

  const mac = M.macd(c);
  const macH = mac.hist[i] as number;
  const macL = mac.line[i] as number;
  const macS = mac.signal[i] as number;

  const bb = M.bb(c, 20, 2);
  const bbPB = bb.pB[i] as number;

  const st = M.stoch(ohlc, is5 ? 5 : 14, 3);
  const stK = st.K[i];
  const stD = st.D[i];

  const atrA = M.atr(ohlc, 14);
  const atrV = atrA[i] as number;

  const adxA = M.adx(ohlc, 14);
  const adxV = (adxA[i] as number) || 0;

  const cciA = M.cci(ohlc, 20);
  const cciV = cciA[i] as number;

  const candle = ohlc[i];
  const cs = candleStats(candle);
  const pats = detectPatternsV8(ohlc);
  const pivs = M.pivots(ohlc);
  const sw = M.swings(ohlc);

  const nearRes = sw.res.filter((v) => v > price).sort((a, b) => a - b)[0];
  const nearSup = sw.sup.filter((v) => v < price).sort((a, b) => b - a)[0];
  const distRes = nearRes ? ((nearRes - price) / price) * 100 : 99;
  const distSup = nearSup ? ((price - nearSup) / price) * 100 : 99;
  const atSup = distSup < 0.12;
  const atRes = distRes < 0.12;

  const atrMin = jpy ? V8_CONFIG.atrMinJPY : V8_CONFIG.atrMinNonJPY;
  const spread = jpy ? V8_CONFIG.spreadJPY : V8_CONFIG.spreadNonJPY;
  const atrOk = Boolean(atrV && atrV >= atrMin);
  const spreadOk = Boolean(atrV && atrV > spread * 2.2);
  const adxOk = adxV >= (is5 ? 16 : 18);
  const adxStrong = adxV >= 22;

  const overExtendedBull = price > e21[i]! + atrV * 1.15;
  const overExtendedBear = price < e21[i]! - atrV * 1.15;
  const bigCandle = cs.body > atrV * 0.9;
  const deadMarket = !atrOk || !spreadOk || adxV < 12;

  const pullbackBull =
    emaBullTrend &&
    wmaBullTrend &&
    (Math.abs(price - e9[i]!) < atrV * 0.65 || Math.abs(price - w20[i]!) < atrV * 0.75);
  const pullbackBear =
    emaBearTrend &&
    wmaBearTrend &&
    (Math.abs(price - e9[i]!) < atrV * 0.65 || Math.abs(price - w20[i]!) < atrV * 0.75);

  const bullPat = pats.filter((p) => p.d === "bull").reduce((a, p) => a + p.s, 0);
  const bearPat = pats.filter((p) => p.d === "bear").reduce((a, p) => a + p.s, 0);

  const bull: V8CheckTuple[] = [
    ["EMA/WMA bullish", emaBullTrend && wmaBullTrend, 18],
    ["Price above EMA21", price > e21[i]!, 8],
    ["RSI rising / >50", rsiV > rsiP && rsiV > 45, 10],
    ["MACD bullish", macL > macS && macH > 0, 10],
    ["Stoch support", stK != null && stD != null && (stK > stD || stK < 25), 8],
    ["ADX strength", adxOk, 8],
    ["ATR active", atrOk && spreadOk, 10],
    ["Pullback zone", pullbackBull || atSup, 8],
    ["Candle bullish", cs.bull && cs.bodyRatio >= 28, 8],
    ["Bull pattern", bullPat > 0, 6],
    ["Not overextended", !overExtendedBull && !bigCandle, 6],
  ];

  const bear: V8CheckTuple[] = [
    ["EMA/WMA bearish", emaBearTrend && wmaBearTrend, 18],
    ["Price below EMA21", price < e21[i]!, 8],
    ["RSI falling / <50", rsiV < rsiP && rsiV < 55, 10],
    ["MACD bearish", macL < macS && macH < 0, 10],
    ["Stoch resistance", stK != null && stD != null && (stK < stD || stK > 75), 8],
    ["ADX strength", adxOk, 8],
    ["ATR active", atrOk && spreadOk, 10],
    ["Pullback zone", pullbackBear || atRes, 8],
    ["Candle bearish", cs.bear && cs.bodyRatio >= 28, 8],
    ["Bear pattern", bearPat > 0, 6],
    ["Not overextended", !overExtendedBear && !bigCandle, 6],
  ];

  const sum = (arr: V8CheckTuple[]) => arr.reduce((s, x) => s + (x[1] ? x[2] : 0), 0);
  const bullScore = sum(bull);
  const bearScore = sum(bear);
  const direction: Direction = bullScore >= bearScore ? "CALL" : "PUT";
  const score = Math.max(bullScore, bearScore);
  const opp = Math.min(bullScore, bearScore);
  const gap = score - opp;
  const checks = direction === "CALL" ? bull : bear;
  const maxScore = bull.reduce((s, x) => s + x[2], 0);

  let conf = Math.round((score / maxScore) * 100 - (opp / maxScore) * 15);
  if (deadMarket) conf -= 18;
  if (movingConflict) conf -= 14;
  if ((direction === "CALL" && overExtendedBull) || (direction === "PUT" && overExtendedBear) || bigCandle)
    conf -= 10;
  conf = Math.max(30, Math.min(95, conf));

  const grade =
    conf >= 78 && score >= 72 ? "A+" : conf >= 66 && score >= 62 ? "A" : conf >= 55 ? "B" : "C";

  const requiredGap = is5 ? V8_CONFIG.scoreGap5 : V8_CONFIG.scoreGap15;
  const blockers: string[] = [];

  if (gap < requiredGap) blockers.push(`Score gap weak (${gap})`);
  if (deadMarket) blockers.push("Low volatility / weak ADX");
  if (movingConflict) blockers.push("EMA/WMA conflict");
  if ((direction === "CALL" && overExtendedBull) || (direction === "PUT" && overExtendedBear))
    blockers.push("Late entry / overextended");
  if (bigCandle) blockers.push("Candle already too large");
  if (direction === "CALL" && !cs.bull && cs.bodyRatio > 35)
    blockers.push("Candle direction against CALL");
  if (direction === "PUT" && !cs.bear && cs.bodyRatio > 35)
    blockers.push("Candle direction against PUT");
  if (
    (direction === "CALL" && bbPB > 0.92 && adxV > 25) ||
    (direction === "PUT" && bbPB < 0.08 && adxV > 25)
  )
    blockers.push("Bollinger trend ride risk");

  let permission: TradePermission = "OBSERVE ONLY";
  let type: SignalType = "WATCH ONLY";
  let reason = "Observation setup. Conditions not enough for trade permission.";

  const finalBase =
    grade !== "C" &&
    grade !== "B" &&
    conf >= 66 &&
    score >= 62 &&
    gap >= requiredGap &&
    adxOk &&
    atrOk &&
    spreadOk &&
    !movingConflict;

  const entryOk =
    blockers.length === 0 ||
    blockers.every((b) => /Bollinger|Candle already/.test(b) === false);

  if (finalBase && entryOk) {
    permission = "TRADE ALLOWED";
    type =
      grade === "A+" &&
      conf >= 76 &&
      score >= 72 &&
      adxStrong &&
      cs.bodyRatio >= 30 &&
      cs.bodyRatio <= 78
        ? "STRONG FINAL"
        : "FINAL TRADE";
    reason =
      "Fresh setup: grade, confidence, score gap, EMA/WMA, ADX, ATR and candle direction are acceptable. Enter only near candle open and verify platform quote.";
  } else if (blockers.some((b) => /Late|large|against|Low volatility|conflict/.test(b))) {
    permission = "DO NOT TRADE";
    type = blockers.some((b) => /Late|large/.test(b)) ? "LATE ENTRY" : "WATCH ONLY";
    reason = blockers.join(" · ");
  } else if (grade === "B") {
    permission = "OBSERVE ONLY";
    type = "WATCH ONLY";
    reason = "B-grade setup. Use only for data collection.";
  }

  const entry = nextCandleTime(tf, asOf?.getTime() ?? Date.now());
  const expiry = new Date(entry.getTime() + parseInt(tf, 10) * 60_000);
  const dp = decimalsForPair(pair);

  return {
    pair,
    tf,
    expiryMin: parseInt(tf, 10),
    direction,
    score,
    gap,
    opp,
    conf,
    grade,
    permission,
    type,
    reason,
    price: +price.toFixed(dp),
    chgPct: +(((price - prev) / prev) * 100).toFixed(3),
    entryDate: formatDate(entry, tz),
    entryTime: formatTime(entry, tz),
    expiryTime: formatTime(expiry, tz),
    entryAtIso: entry.toISOString(),
    expAtIso: expiry.toISOString(),
    rsi: rsiV,
    stoch: stK as number,
    cci: cciV,
    bbPB,
    macdH: macH,
    atr: atrV,
    adx: adxV,
    pivs,
    nearRes,
    nearSup,
    checks,
    blockers,
    pats,
    candle: cs,
    ohlc,
    emaBullTrend,
    emaBearTrend,
    wmaBullTrend,
    wmaBearTrend,
    movingConflict,
    overExtendedBull,
    overExtendedBear,
    bigCandle,
    atrOk,
    spreadOk,
  };
}

export function buildV8SignalUid(raw: V8RawSignal): string {
  return `${raw.pair}_${raw.tf}_${raw.direction}_${raw.entryDate}_${raw.entryTime}_${raw.expiryTime}`.replace(
    /[^A-Za-z0-9_]/g,
    ""
  );
}
