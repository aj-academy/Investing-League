import type { OHLC } from "@/lib/signal-engine/types";

const memoryCache = new Map<string, { data: OHLC[]; ts: number }>();
/** In-memory TTL — keep high to avoid burning Twelve Data credits on Vercel. */
const TTL_MS = 5 * 60 * 1000;

export function getCachedCandles(pair: string, interval: string, outputsize: number) {
  const key = `${pair}_${interval}_${outputsize}`;
  const hit = memoryCache.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.data;
  return null;
}

export function setCachedCandles(
  pair: string,
  interval: string,
  outputsize: number,
  data: OHLC[]
) {
  const key = `${pair}_${interval}_${outputsize}`;
  memoryCache.set(key, { data, ts: Date.now() });
}
