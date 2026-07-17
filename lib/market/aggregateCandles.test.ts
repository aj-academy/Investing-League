import { describe, expect, it } from "vitest";
import { aggregateTo2Min, parseCandleTimeMs } from "./aggregateCandles";
import type { OHLC } from "@/lib/signal-engine/types";

function bar(date: string, o: number, h: number, l: number, c: number): OHLC {
  return { date, open: o, high: h, low: l, close: c };
}

describe("aggregateTo2Min", () => {
  it("folds two 1m candles into one 2m bar", () => {
    const oneMin = [
      bar("2026-07-17 10:00:00", 1.1, 1.12, 1.09, 1.11),
      bar("2026-07-17 10:01:00", 1.11, 1.13, 1.1, 1.12),
      bar("2026-07-17 10:02:00", 1.12, 1.14, 1.11, 1.13),
      bar("2026-07-17 10:03:00", 1.13, 1.15, 1.12, 1.14),
    ];
    const out = aggregateTo2Min(oneMin);
    expect(out.length).toBe(2);
    expect(out[0].open).toBe(1.1);
    expect(out[0].high).toBe(1.13);
    expect(out[0].low).toBe(1.09);
    expect(out[0].close).toBe(1.12);
    expect(out[1].open).toBe(1.12);
    expect(out[1].close).toBe(1.14);
  });

  it("parseCandleTimeMs handles Twelve Data format", () => {
    expect(Number.isFinite(parseCandleTimeMs("2026-07-17 10:00:00"))).toBe(true);
  });
});
