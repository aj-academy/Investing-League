import type { OHLC } from "@/lib/signal-engine/types";

const memoryCache = new Map<string, { data: OHLC[]; ts: number }>();
const DEFAULT_TTL_MS = 75_000;

export function getCachedCandles(
  pair: string,
  interval: string,
  outputsize: number,
  ttlMs: number = DEFAULT_TTL_MS
) {
  const key = `${pair}_${interval}_${outputsize}`;
  const hit = memoryCache.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) return hit.data;
  return null;
}

export function setCachedCandles(
  pair: string,
  interval: string,
  outputsize: number,
  data: OHLC[],
  ttlMs: number = DEFAULT_TTL_MS
) {
  const key = `${pair}_${interval}_${outputsize}`;
  memoryCache.set(key, { data, ts: Date.now() });
  void ttlMs;
}
