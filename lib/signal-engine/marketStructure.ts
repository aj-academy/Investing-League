import type { MarketStructure, OHLC } from "./types";

export function detectMarketStructure(ohlc: OHLC[]): MarketStructure {
  if (!ohlc || ohlc.length < 20)
    return {
      trend: "neutral",
      bullishBOS: false,
      bearishBOS: false,
      lastSwingHigh: null,
      lastSwingLow: null,
      structureScore: 0,
    };

  const highs: { index: number; price: number }[] = [];
  const lows: { index: number; price: number }[] = [];
  for (let i = 3; i < ohlc.length - 3; i++) {
    const c = ohlc[i];
    const isHigh =
      c.high > ohlc[i - 1].high &&
      c.high > ohlc[i - 2].high &&
      c.high > ohlc[i + 1].high &&
      c.high > ohlc[i + 2].high;
    const isLow =
      c.low < ohlc[i - 1].low &&
      c.low < ohlc[i - 2].low &&
      c.low < ohlc[i + 1].low &&
      c.low < ohlc[i + 2].low;
    if (isHigh) highs.push({ index: i, price: c.high });
    if (isLow) lows.push({ index: i, price: c.low });
  }

  const lastClose = ohlc[ohlc.length - 2].close;
  const lastHighs = highs.slice(-3);
  const lastLows = lows.slice(-3);
  const lastSwingHigh = lastHighs.length ? lastHighs[lastHighs.length - 1].price : null;
  const lastSwingLow = lastLows.length ? lastLows[lastLows.length - 1].price : null;

  let higherHigh = false,
    higherLow = false,
    lowerHigh = false,
    lowerLow = false;
  if (lastHighs.length >= 2) {
    higherHigh = lastHighs[lastHighs.length - 1].price > lastHighs[lastHighs.length - 2].price;
    lowerHigh = lastHighs[lastHighs.length - 1].price < lastHighs[lastHighs.length - 2].price;
  }
  if (lastLows.length >= 2) {
    higherLow = lastLows[lastLows.length - 1].price > lastLows[lastLows.length - 2].price;
    lowerLow = lastLows[lastLows.length - 1].price < lastLows[lastLows.length - 2].price;
  }

  const bullishBOS = lastSwingHigh !== null && lastClose > lastSwingHigh;
  const bearishBOS = lastSwingLow !== null && lastClose < lastSwingLow;

  let trend: MarketStructure["trend"] = "neutral";
  let structureScore = 0;
  if (higherHigh && higherLow || bullishBOS) {
    trend = "bullish";
    structureScore = bullishBOS ? 3 : 2;
  } else if (lowerHigh && lowerLow || bearishBOS) {
    trend = "bearish";
    structureScore = bearishBOS ? 3 : 2;
  }

  return {
    trend,
    bullishBOS,
    bearishBOS,
    lastSwingHigh,
    lastSwingLow,
    higherHigh,
    higherLow,
    lowerHigh,
    lowerLow,
    structureScore,
  };
}

export function calculateEmaCompression(price: number, emas: (number | null)[]) {
  const valid = emas.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (valid.length < 3 || !Number.isFinite(price)) return 999;
  return ((Math.max(...valid) - Math.min(...valid)) / price) * 100;
}

export function categoryScore(parts: { pass: boolean; weight: number }[]) {
  const total = parts.reduce((s, p) => s + p.weight, 0);
  return total
    ? Math.round((parts.reduce((s, p) => s + (p.pass ? p.weight : 0), 0) / total) * 100)
    : 0;
}

export function getSignalGrade(
  conf: number,
  scoreGap: number,
  structureTrend: string,
  direction: string
) {
  const aligned =
    (direction === "CALL" && structureTrend === "bullish") ||
    (direction === "PUT" && structureTrend === "bearish");
  if (conf >= 78 && scoreGap >= 4 && aligned) return "A+";
  if (conf >= 64 && scoreGap >= 3) return "A";
  if (conf >= 50 && scoreGap >= 2) return "B";
  return "AVOID";
}
