import type { OHLC } from "../types";

/** Deterministic uptrend fixture for V8 regression tests. */
export function buildUptrendBars(count = 120, start = 1.085): OHLC[] {
  const bars: OHLC[] = [];
  let price = start;
  for (let i = 0; i < count; i++) {
    const open = price;
    const close = price + 0.00012 + Math.sin(i * 0.35) * 0.00002;
    const high = Math.max(open, close) + 0.00009;
    const low = Math.min(open, close) - 0.00003;
    price = close;
    bars.push({
      date: new Date(Date.UTC(2026, 0, 5, 8, 0, i * 60)).toISOString(),
      open,
      high,
      low,
      close,
    });
  }
  return bars;
}

/** Fixed Monday London session instant (not weekend). */
export const FIXTURE_AS_OF = new Date("2026-01-05T12:00:00.000Z");

/** Saturday thin-market instant. */
export const WEEKEND_AS_OF = new Date("2026-01-03T14:00:00.000Z");
