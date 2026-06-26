import { M } from "../indicators";
import type { Direction, OHLC } from "../types";
import type { HtfBiasResult } from "./types";

/** 15-minute HTF bias for 5-minute signals. */
export function evaluateHtfBias(
  ohlc15: OHLC[] | undefined,
  direction: Direction,
): HtfBiasResult {
  if (!ohlc15 || ohlc15.length < 30) {
    return { ok: false, status: "15m data unavailable", ema9: 0, ema21: 0, slope: 0 };
  }

  const c = ohlc15.map((x) => x.close);
  const n = c.length;
  const i = n - 2;
  const e9 = M.ema(c, 9);
  const e21 = M.ema(c, 21);
  const ema9 = e9[i] as number;
  const ema21 = e21[i] as number;
  const ema9Prev = e9[i - 1] as number;
  const ema9Prev2 = e9[i - 2] as number;
  const close = c[i];
  const slope = ema9 - ema9Prev2;

  if (![ema9, ema21, close, ema9Prev, ema9Prev2].every(Number.isFinite)) {
    return { ok: false, status: "15m EMA incomplete", ema9, ema21, slope };
  }

  if (direction === "CALL") {
    const ok = ema9 > ema21 && close > ema21 && ema9 > ema9Prev && ema9Prev >= ema9Prev2;
    return {
      ok,
      status: ok ? "15m bullish bias" : "15min trend does not support 5min direction",
      ema9,
      ema21,
      slope,
    };
  }

  const ok = ema9 < ema21 && close < ema21 && ema9 < ema9Prev && ema9Prev <= ema9Prev2;
  return {
    ok,
    status: ok ? "15m bearish bias" : "15min trend does not support 5min direction",
    ema9,
    ema21,
    slope,
  };
}
