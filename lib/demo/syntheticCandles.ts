import type { OHLC } from "@/lib/signal-engine/types";

/** Generates realistic-looking OHLC for demo scans when no API key is set. */
export function generateSyntheticCandles(
  pair: string,
  count = 150,
  intervalMinutes = 5
): OHLC[] {
  const base =
    pair.includes("JPY") ? 150 : pair.startsWith("USD") ? 1.08 : 1.25;
  const candles: OHLC[] = [];
  let price = base;
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const t = new Date(now - (count - i) * intervalMinutes * 60 * 1000);
    const drift = (Math.random() - 0.48) * base * 0.0008;
    const open = price;
    const close = price + drift;
    const high = Math.max(open, close) + Math.random() * base * 0.0003;
    const low = Math.min(open, close) - Math.random() * base * 0.0003;
    candles.push({
      date: t.toISOString(),
      open,
      high,
      low,
      close,
    });
    price = close;
  }
  return candles;
}
