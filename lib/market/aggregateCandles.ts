import type { OHLC } from "@/lib/signal-engine/types";

/** Parse Twelve Data-style datetime into epoch ms for bucketing. */
export function parseCandleTimeMs(date: string): number {
  if (!date) return NaN;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(date)) {
    const t = Date.parse(date.replace(" ", "T") + "Z");
    if (Number.isFinite(t)) return t;
  }
  const t = Date.parse(date);
  return Number.isFinite(t) ? t : NaN;
}

/**
 * Aggregate 1-minute OHLC into N-minute bars (e.g. 2min).
 * Buckets by UTC floor of timestamp. Incomplete trailing bucket is kept
 * so the latest forming bar is available for direction checks.
 */
export function aggregateOhlcByMinutes(candles: OHLC[], minutes: number): OHLC[] {
  if (minutes <= 1 || candles.length === 0) return candles;

  const bucketMs = minutes * 60_000;
  const buckets = new Map<number, OHLC>();

  for (const c of candles) {
    const t = parseCandleTimeMs(c.date);
    if (!Number.isFinite(t)) continue;
    const key = Math.floor(t / bucketMs) * bucketMs;
    const existing = buckets.get(key);
    if (!existing) {
      buckets.set(key, {
        date: c.date,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      });
    } else {
      existing.high = Math.max(existing.high, c.high);
      existing.low = Math.min(existing.low, c.low);
      existing.close = c.close;
      // keep first open; update date to last candle in bucket for freshness
      existing.date = c.date;
    }
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, bar]) => bar);
}

/** Build 2-minute OHLC from 1-minute series. */
export function aggregateTo2Min(oneMinCandles: OHLC[]): OHLC[] {
  return aggregateOhlcByMinutes(oneMinCandles, 2);
}
