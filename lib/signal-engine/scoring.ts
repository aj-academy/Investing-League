import { decimalsForPair, isNum } from "@/lib/utils";
import { M } from "./indicators";
import {
  calculateEmaCompression,
  categoryScore,
  detectMarketStructure,
  getSignalGrade,
} from "./marketStructure";
import { detectPatterns } from "./patterns";
import { getSessionQualityScore } from "./session";
import { formatSignalTime, resolveTimeZone } from "@/lib/datetime";
import type { ComputedSignal, OHLC } from "./types";

function fmtTime(d: Date, timeZone: string) {
  return formatSignalTime(d, timeZone);
}

export function buildSignalUid(
  pair: string,
  tf: string,
  direction: string,
  entryTime: string,
  expTime: string
) {
  const date = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return [date, pair, tf, direction, entryTime, expTime].join("|").replace(/\s+/g, "_");
}

export function computeBaseSignal(
  ohlc: OHLC[],
  pair: string,
  tf: string,
  timeZone?: string
): Omit<
  ComputedSignal,
  | "signalUid"
  | "signalType"
  | "signalReason"
  | "tradeEligible"
  | "mode"
  | "adx"
  | "candleBodyRatio"
  | "candleBullish"
  | "candleBearish"
  | "candleStrengthText"
> | null {
  if (ohlc.length < 80) return null;

  const closes = ohlc.map((c) => c.close);
  const n = closes.length;
  const i = n - 2;
  const price = closes[i];
  const is5min = tf === "5min";

  const e5 = M.ema(closes, 5),
    e8 = M.ema(closes, 8),
    e13 = M.ema(closes, 13),
    e21 = M.ema(closes, 21),
    e50 = M.ema(closes, 50),
    e100 = M.ema(closes, 100);
  const eFast = is5min ? M.ema(closes, 9) : M.ema(closes, 20);
  const eSlow = is5min ? M.ema(closes, 21) : M.ema(closes, 50);
  const trendEma = is5min ? e50 : e100;
  const wFast = is5min ? M.wma(closes, 5) : M.wma(closes, 10);
  const wSlow = is5min ? M.wma(closes, 20) : M.wma(closes, 30);

  const e5v = e5[i],
    e8v = e8[i],
    e13v = e13[i],
    e21v = e21[i],
    e50v = e50[i];
  const e5p = e5[i - 1],
    e8p = e8[i - 1],
    e21p = e21[i - 1],
    e50p = e50[i - 1];
  const emaFast = eFast[i],
    emaSlow = eSlow[i],
    emaFastP = eFast[i - 1],
    emaSlowP = eSlow[i - 1];
  const wmaFast = wFast[i],
    wmaSlow = wSlow[i],
    wmaFastP = wFast[i - 1],
    wmaSlowP = wSlow[i - 1];
  const trendEmaV = trendEma[i];

  const ribbonBull = is5min ? e5v > e8v && e8v > e13v : e21v > e50v;
  const ribbonBear = is5min ? e5v < e8v && e8v < e13v : e21v < e50v;
  const crossBull = is5min ? e5v > e8v && e5p <= e8p : e21v > e50v && e21p <= e50p;
  const crossBear = is5min ? e5v < e8v && e5p >= e8p : e21v < e50v && e21p >= e50p;
  const priceAbove = is5min ? price > e13v : price > e50v;
  const priceBelow = is5min ? price < e13v : price < e50v;

  const emaBullTrend = isNum(emaFast) && isNum(emaSlow) && emaFast > emaSlow;
  const emaBearTrend = isNum(emaFast) && isNum(emaSlow) && emaFast < emaSlow;
  const emaBullCross =
    isNum(emaFast) &&
    isNum(emaSlow) &&
    isNum(emaFastP) &&
    isNum(emaSlowP) &&
    emaFast > emaSlow &&
    emaFastP <= emaSlowP;
  const emaBearCross =
    isNum(emaFast) &&
    isNum(emaSlow) &&
    isNum(emaFastP) &&
    isNum(emaSlowP) &&
    emaFast < emaSlow &&
    emaFastP >= emaSlowP;
  const wmaBullTrend = isNum(wmaFast) && isNum(wmaSlow) && wmaFast > wmaSlow;
  const wmaBearTrend = isNum(wmaFast) && isNum(wmaSlow) && wmaFast < wmaSlow;
  const wmaBullCross =
    isNum(wmaFast) &&
    isNum(wmaSlow) &&
    isNum(wmaFastP) &&
    isNum(wmaSlowP) &&
    wmaFast > wmaSlow &&
    wmaFastP <= wmaSlowP;
  const wmaBearCross =
    isNum(wmaFast) &&
    isNum(wmaSlow) &&
    isNum(wmaFastP) &&
    isNum(wmaSlowP) &&
    wmaFast < wmaSlow &&
    wmaFastP >= wmaSlowP;
  const priceAboveTrend = isNum(trendEmaV) && price > trendEmaV;
  const priceBelowTrend = isNum(trendEmaV) && price < trendEmaV;

  const msx = detectMarketStructure(ohlc);
  const structureBull = msx.trend === "bullish" || msx.bullishBOS;
  const structureBear = msx.trend === "bearish" || msx.bearishBOS;

  const rsiPeriod = is5min ? 9 : 14;
  const obLevel = is5min ? 75 : 70;
  const osLevel = is5min ? 25 : 30;
  const rsiArr = M.rsi(closes, rsiPeriod);
  const rsiV = rsiArr[i],
    rsiPv = rsiArr[i - 1];
  const rsiBull = isNum(rsiV) && isNum(rsiPv) && rsiV < osLevel && rsiV > rsiPv;
  const rsiBear = isNum(rsiV) && isNum(rsiPv) && rsiV > obLevel && rsiV < rsiPv;
  const rsiMidBull = isNum(rsiV) && rsiV > 50;
  const rsiMidBear = isNum(rsiV) && rsiV < 50;
  const rsiRising = isNum(rsiV) && isNum(rsiPv) && rsiV > rsiPv;
  const rsiFalling = isNum(rsiV) && isNum(rsiPv) && rsiV < rsiPv;
  const rsiDivBull =
    isNum(rsiV) && isNum(rsiArr[i - 3]) && closes[i] < closes[i - 3] && rsiV > rsiArr[i - 3]!;
  const rsiDivBear =
    isNum(rsiV) && isNum(rsiArr[i - 3]) && closes[i] > closes[i - 3] && rsiV < rsiArr[i - 3]!;

  const mac = M.macd(closes);
  const ml = mac.line,
    ms = mac.signal,
    mh = mac.hist;
  const macdL = ml[i],
    macdS = ms[i],
    macdH = mh[i],
    macdLp = ml[i - 1],
    macdSp = ms[i - 1];
  const macdCrossBull =
    isNum(macdL) &&
    isNum(macdS) &&
    isNum(macdLp) &&
    isNum(macdSp) &&
    macdL > macdS &&
    macdLp <= macdSp;
  const macdCrossBear =
    isNum(macdL) &&
    isNum(macdS) &&
    isNum(macdLp) &&
    isNum(macdSp) &&
    macdL < macdS &&
    macdLp >= macdSp;
  const macdAbove = isNum(macdL) && isNum(macdS) && macdL > macdS && macdH > 0;
  const macdBelow = isNum(macdL) && isNum(macdS) && macdL < macdS && macdH < 0;
  const macdZeroBull = isNum(macdL) && isNum(macdLp) && macdL > 0 && macdLp <= 0;
  const macdZeroBear = isNum(macdL) && isNum(macdLp) && macdL < 0 && macdLp >= 0;

  const bbR = M.bb(closes, 20, 2);
  const bbPB = bbR.pB[i],
    bbU = bbR.up[i],
    bbL = bbR.lo[i];
  const bbPrevWidth =
    isNum(bbR.up[i - 5]) && isNum(bbR.lo[i - 5]) ? bbR.up[i - 5]! - bbR.lo[i - 5]! : null;
  const bbWidth = isNum(bbU) && isNum(bbL) ? bbU - bbL : null;
  const bbSqueeze = isNum(bbWidth) && isNum(bbPrevWidth) && bbWidth < bbPrevWidth * 0.7;
  const bbBull = isNum(bbPB) && bbPB < 0.2;
  const bbBear = isNum(bbPB) && bbPB > 0.8;
  const bbBreachBull = isNum(bbPB) && bbPB < 0;
  const bbBreachBear = isNum(bbPB) && bbPB > 1;

  const stR = M.stoch(ohlc, is5min ? 5 : 14, 3);
  const stK = stR.K[i],
    stD = stR.D[i],
    stKp = stR.K[i - 1],
    stDp = stR.D[i - 1];
  const stCrossBull =
    isNum(stK) && isNum(stD) && isNum(stKp) && isNum(stDp) && stK > stD && stKp <= stDp;
  const stCrossBear =
    isNum(stK) && isNum(stD) && isNum(stKp) && isNum(stDp) && stK < stD && stKp >= stDp;
  const stOversold = isNum(stK) && stK < 20;
  const stOverbought = isNum(stK) && stK > 80;

  const atrA = M.atr(ohlc, 14);
  const atrV = atrA[i];
  const atrValid = atrA.filter(isNum).slice(-20);
  const atrAvg = atrValid.length
    ? atrValid.reduce((a, b) => a + b, 0) / atrValid.length
    : null;
  const volOk = isNum(atrV) && isNum(atrAvg) && atrV > atrAvg * 0.42;
  const candle = ohlc[i];
  const candleRange = candle.high - candle.low;
  const bigCandle = isNum(atrV) && candleRange > atrV * 1.45;
  const overExtendedBull = isNum(atrV) && price > e21v + atrV * 1.2;
  const overExtendedBear = isNum(atrV) && price < e21v - atrV * 1.2;

  const cciA = M.cci(ohlc, 20);
  const cciV = cciA[i];
  const cciBull = isNum(cciV) && cciV < -100;
  const cciBear = isNum(cciV) && cciV > 100;

  const pivs = M.pivots(ohlc);
  const swg = M.swings(ohlc);
  const nearRes = swg.res.filter((v) => v > price).sort((a, b) => a - b)[0];
  const nearSup = swg.sup.filter((v) => v < price).sort((a, b) => b - a)[0];
  const distRes = nearRes ? ((nearRes - price) / price) * 100 : 99;
  const distSup = nearSup ? ((price - nearSup) / price) * 100 : 99;
  const atSupport = distSup < 0.12;
  const atResistance = distRes < 0.12;

  const pats = detectPatterns(ohlc);
  const patBull = pats.filter((p) => p.d === "bull").reduce((a, p) => a + p.s, 0);
  const patBear = pats.filter((p) => p.d === "bear").reduce((a, p) => a + p.s, 0);

  const emaCompression = calculateEmaCompression(price, [
    e5v,
    e8v,
    e13v,
    e21v,
    e50v,
    emaFast,
    emaSlow,
    wmaFast,
    wmaSlow,
  ]);
  const sidewaysMarket = emaCompression < (is5min ? 0.04 : 0.06);
  const priceMidZone =
    !atSupport && !atResistance && isNum(bbPB) && bbPB > 0.35 && bbPB < 0.65;
  const movingAverageConflict =
    (emaBullTrend && wmaBearTrend) || (emaBearTrend && wmaBullTrend);

  const trendMomentumBull =
    emaBullTrend &&
    wmaBullTrend &&
    priceAboveTrend &&
    (rsiRising || rsiMidBull) &&
    volOk &&
    !movingAverageConflict;
  const trendMomentumBear =
    emaBearTrend &&
    wmaBearTrend &&
    priceBelowTrend &&
    (rsiFalling || rsiMidBear) &&
    volOk &&
    !movingAverageConflict;

  const bullCategory = {
    trend: categoryScore([
      { pass: emaBullTrend, weight: 3 },
      { pass: wmaBullTrend, weight: 3 },
      { pass: priceAboveTrend, weight: 2 },
      { pass: ribbonBull, weight: 2 },
      { pass: crossBull || emaBullCross || wmaBullCross, weight: 2 },
      { pass: structureBull, weight: 3 },
    ]),
    momentum: categoryScore([
      { pass: trendMomentumBull, weight: 3 },
      { pass: rsiBull || rsiDivBull || rsiRising, weight: 3 },
      { pass: rsiMidBull, weight: 1 },
      { pass: macdCrossBull || macdAbove, weight: 3 },
      { pass: macdZeroBull, weight: 1 },
      { pass: stCrossBull || stOversold, weight: 2 },
      { pass: cciBull, weight: 1 },
    ]),
    volatility: categoryScore([
      { pass: volOk, weight: 3 },
      { pass: !sidewaysMarket, weight: 2 },
      { pass: !bbSqueeze, weight: 1 },
      { pass: !bigCandle, weight: 1 },
      { pass: !overExtendedBull, weight: 2 },
    ]),
    sr: categoryScore([
      { pass: atSupport, weight: 3 },
      { pass: bbBull || bbBreachBull, weight: 2 },
      { pass: price <= pivs.P || priceAbove, weight: 1 },
    ]),
    candle: categoryScore([
      { pass: patBull > 0, weight: 3 },
      { pass: patBull >= 2, weight: 2 },
      { pass: candle.close > candle.open, weight: 1 },
    ]),
  };

  const bearCategory = {
    trend: categoryScore([
      { pass: emaBearTrend, weight: 3 },
      { pass: wmaBearTrend, weight: 3 },
      { pass: priceBelowTrend, weight: 2 },
      { pass: ribbonBear, weight: 2 },
      { pass: crossBear || emaBearCross || wmaBearCross, weight: 2 },
      { pass: structureBear, weight: 3 },
    ]),
    momentum: categoryScore([
      { pass: trendMomentumBear, weight: 3 },
      { pass: rsiBear || rsiDivBear || rsiFalling, weight: 3 },
      { pass: rsiMidBear, weight: 1 },
      { pass: macdCrossBear || macdBelow, weight: 3 },
      { pass: macdZeroBear, weight: 1 },
      { pass: stCrossBear || stOverbought, weight: 2 },
      { pass: cciBear, weight: 1 },
    ]),
    volatility: categoryScore([
      { pass: volOk, weight: 3 },
      { pass: !sidewaysMarket, weight: 2 },
      { pass: !bbSqueeze, weight: 1 },
      { pass: !bigCandle, weight: 1 },
      { pass: !overExtendedBear, weight: 2 },
    ]),
    sr: categoryScore([
      { pass: atResistance, weight: 3 },
      { pass: bbBear || bbBreachBear, weight: 2 },
      { pass: price >= pivs.P || priceBelow, weight: 1 },
    ]),
    candle: categoryScore([
      { pass: patBear > 0, weight: 3 },
      { pass: patBear >= 2, weight: 2 },
      { pass: candle.close < candle.open, weight: 1 },
    ]),
  };

  const finalWeightedScore = (cat: typeof bullCategory) =>
    Math.round(
      cat.trend * 0.3 +
        cat.momentum * 0.2 +
        cat.volatility * 0.15 +
        cat.sr * 0.15 +
        cat.candle * 0.1 +
        getSessionQualityScore() * 0.1
    );

  const bullWeighted = finalWeightedScore(bullCategory);
  const bearWeighted = finalWeightedScore(bearCategory);
  const scoreGap = Math.abs(bullWeighted - bearWeighted);
  const direction = bullWeighted > bearWeighted ? "CALL" : "PUT";
  const weightedScore = Math.max(bullWeighted, bearWeighted);
  const oppositeScore = Math.min(bullWeighted, bearWeighted);

  if (scoreGap < 4) return null;
  if (movingAverageConflict && scoreGap < 14) return null;
  if (sidewaysMarket && scoreGap < 10) return null;
  if (priceMidZone && scoreGap < 7) return null;
  if (!volOk && weightedScore < 60) return null;
  if (direction === "CALL" && overExtendedBull && weightedScore < 72) return null;
  if (direction === "PUT" && overExtendedBear && weightedScore < 72) return null;
  if (bigCandle && weightedScore < 70) return null;

  const score = Math.round(weightedScore / 10);
  let conf = Math.round(weightedScore - oppositeScore * 0.18);
  if (!volOk) conf = Math.round(conf * 0.88);
  if (sidewaysMarket) conf = Math.round(conf * 0.82);
  if (movingAverageConflict) conf = Math.round(conf * 0.75);
  if (
    (direction === "CALL" && trendMomentumBull) ||
    (direction === "PUT" && trendMomentumBear)
  )
    conf = Math.min(96, conf + 5);
  conf = Math.min(96, Math.max(40, conf));

  const grade = getSignalGrade(conf, scoreGap, msx.trend, direction);
  if (grade === "AVOID") return null;
  const tier =
    grade === "A+" ? "★★★ A+ STRONG" : grade === "A" ? "★★ A QUALITY" : "★ B WATCH";

  const tz = resolveTimeZone(timeZone);
  const exMs = (tf.startsWith("15") ? 15 : 5) * 60_000;
  const entry = new Date(Math.ceil(Date.now() / exMs) * exMs);
  const expiry = new Date(entry.getTime() + exMs);
  const maxEntryDrift = isNum(atrV) ? atrV * 0.25 : 0;
  const driftText = maxEntryDrift ? maxEntryDrift.toFixed(decimalsForPair(pair)) : "—";
  const chgPct = ((price - closes[i - 1]) / closes[i - 1]) * 100;

  const bullChecks = [
    { name: "EMA Bull Trend", pass: emaBullTrend, weight: 3 },
    { name: "WMA Bull Momentum", pass: wmaBullTrend, weight: 3 },
    { name: "Price Above Trend EMA", pass: priceAboveTrend, weight: 2 },
    { name: "EMA/WMA Cross Up", pass: emaBullCross || wmaBullCross || crossBull, weight: 2 },
    { name: "Trend Structure Bullish", pass: structureBull, weight: 3 },
    { name: "RSI Turning Up", pass: rsiBull || rsiRising || rsiDivBull, weight: 2 },
    { name: "MACD Bullish", pass: macdCrossBull || macdAbove, weight: 2 },
    { name: "Support Zone", pass: atSupport || bbBull || bbBreachBull, weight: 2 },
    { name: "Not Overextended", pass: !overExtendedBull, weight: 2 },
    { name: "Good Volatility", pass: volOk, weight: 1 },
    { name: "No Sideways Market", pass: !sidewaysMarket, weight: 1 },
  ];
  const bearChecks = [
    { name: "EMA Bear Trend", pass: emaBearTrend, weight: 3 },
    { name: "WMA Bear Momentum", pass: wmaBearTrend, weight: 3 },
    { name: "Price Below Trend EMA", pass: priceBelowTrend, weight: 2 },
    { name: "EMA/WMA Cross Down", pass: emaBearCross || wmaBearCross || crossBear, weight: 2 },
    { name: "Trend Structure Bearish", pass: structureBear, weight: 3 },
    { name: "RSI Turning Down", pass: rsiBear || rsiFalling || rsiDivBear, weight: 2 },
    { name: "MACD Bearish", pass: macdCrossBear || macdBelow, weight: 2 },
    { name: "Resistance Zone", pass: atResistance || bbBear || bbBreachBear, weight: 2 },
    { name: "Not Overextended", pass: !overExtendedBear, weight: 2 },
    { name: "Good Volatility", pass: volOk, weight: 1 },
    { name: "No Sideways Market", pass: !sidewaysMarket, weight: 1 },
  ];
  const checks = direction === "CALL" ? bullChecks : bearChecks;
  const topPassed = checks.filter((c) => c.pass).map((c) => c.name).slice(0, 5);
  const emaWmaBias = emaBullTrend && wmaBullTrend
    ? "BULLISH"
    : emaBearTrend && wmaBearTrend
      ? "BEARISH"
      : movingAverageConflict
        ? "MIXED"
        : "NEUTRAL";
  const reason = `<strong>${direction} ${grade}</strong> — ${topPassed.join(" · ")}${sidewaysMarket ? " · ⚠ EMA/WMA compression" : ""}${!volOk ? " · ⚠ Low volatility" : ""}${bigCandle ? " · ⚠ Large candle" : ""}`;

  return {
    pair,
    direction: direction as "CALL" | "PUT",
    tf,
    score,
    conf,
    tier,
    grade,
    scoreGap,
    weightedScore,
    oppositeScore,
    category: direction === "CALL" ? bullCategory : bearCategory,
    marketStructure: msx,
    emaWmaBias,
    emaBullTrend,
    emaBearTrend,
    wmaBullTrend,
    wmaBearTrend,
    emaBullCross,
    emaBearCross,
    wmaBullCross,
    wmaBearCross,
    trendMomentumBull,
    trendMomentumBear,
    overExtendedBull,
    overExtendedBear,
    bigCandle,
    price: price.toFixed(decimalsForPair(pair)),
    chgPct: chgPct.toFixed(3),
    entryAtIso: entry.toISOString(),
    expAtIso: expiry.toISOString(),
    entryTime: fmtTime(entry, tz),
    expTime: fmtTime(expiry, tz),
    expMin: tf === "5min" ? 5 : 15,
    maxEntryDrift: driftText,
    entryNote: `Cancel signal if price moves more than ${driftText} before entry. Avoid entry if price is already extended away from EMA/WMA.`,
    riskNote:
      "Educational signal only. Confirm manually before trade.",
    rsi: isNum(rsiV) ? rsiV.toFixed(1) : "—",
    stoch: isNum(stK) ? stK.toFixed(1) : "—",
    cci: isNum(cciV) ? cciV.toFixed(0) : "—",
    bb: isNum(bbPB) ? (bbPB * 100).toFixed(1) + "%" : "—",
    macdH: isNum(macdH) ? macdH.toFixed(6) : "—",
    atr: isNum(atrV) ? atrV.toFixed(5) : "—",
    bullChecks,
    bearChecks,
    checks,
    pats,
    pivs,
    nearRes,
    nearSup,
    volOk,
    sidewaysMarket,
    emaCompression,
    reason,
    ohlc,
  };
}
