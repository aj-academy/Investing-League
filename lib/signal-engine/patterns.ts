import type { OHLC, Pattern } from "./types";

export function detectPatterns(ohlc: OHLC[]): Pattern[] {
  const n = ohlc.length;
  if (n < 5) return [];
  const res: Pattern[] = [];
  const c2 = ohlc[n - 2],
    c3 = ohlc[n - 3],
    c4 = ohlc[n - 4];
  const body = (v: OHLC) => Math.abs(v.close - v.open);
  const rng = (v: OHLC) => v.high - v.low || 1e-10;
  const uw = (v: OHLC) => v.high - Math.max(v.open, v.close);
  const lw = (v: OHLC) => Math.min(v.open, v.close) - v.low;
  const bull = (v: OHLC) => v.close >= v.open;
  const bear = (v: OHLC) => v.close < v.open;

  if (lw(c2) > 2 * body(c2) && uw(c2) < body(c2) * 0.5 && body(c2) / rng(c2) > 0.1)
    res.push({ n: "Hammer", d: "bull", s: 2 });
  if (uw(c2) > 2 * body(c2) && lw(c2) < body(c2) * 0.5 && body(c2) / rng(c2) > 0.1)
    res.push({ n: "Shooting Star", d: "bear", s: 2 });
  if (body(c2) / rng(c2) < 0.07) res.push({ n: "Doji", d: "neutral", s: 1 });
  if (bull(c2) && body(c2) / rng(c2) > 0.85) res.push({ n: "Bull Marubozu", d: "bull", s: 2 });
  if (bear(c2) && body(c2) / rng(c2) > 0.85) res.push({ n: "Bear Marubozu", d: "bear", s: 2 });
  if (bear(c3) && bull(c2) && c2.open <= c3.close && c2.close >= c3.open)
    res.push({ n: "Bull Engulfing", d: "bull", s: 3 });
  if (bull(c3) && bear(c2) && c2.open >= c3.close && c2.close <= c3.open)
    res.push({ n: "Bear Engulfing", d: "bear", s: 3 });
  if (Math.abs(c3.low - c2.low) / rng(c3) < 0.04 && bear(c3) && bull(c2))
    res.push({ n: "Tweezer Bottom", d: "bull", s: 2 });
  if (Math.abs(c3.high - c2.high) / rng(c3) < 0.04 && bull(c3) && bear(c2))
    res.push({ n: "Tweezer Top", d: "bear", s: 2 });
  if (
    bear(c4) &&
    body(c3) < body(c4) * 0.35 &&
    bull(c2) &&
    c2.close > (c4.open + c4.close) / 2
  )
    res.push({ n: "Morning Star", d: "bull", s: 3 });
  if (
    bull(c4) &&
    body(c3) < body(c4) * 0.35 &&
    bear(c2) &&
    c2.close < (c4.open + c4.close) / 2
  )
    res.push({ n: "Evening Star", d: "bear", s: 3 });
  if (bull(c4) && bull(c3) && bull(c2) && c3.close > c4.close && c2.close > c3.close && c3.open > c4.open)
    res.push({ n: "3 White Soldiers", d: "bull", s: 3 });
  if (bear(c4) && bear(c3) && bear(c2) && c3.close < c4.close && c2.close < c3.close && c3.open < c4.open)
    res.push({ n: "3 Black Crows", d: "bear", s: 3 });
  const totalWick = uw(c2) + lw(c2);
  if (totalWick > body(c2) * 3) {
    if (lw(c2) > uw(c2) * 2) res.push({ n: "Bull Pin Bar", d: "bull", s: 2 });
    else if (uw(c2) > lw(c2) * 2) res.push({ n: "Bear Pin Bar", d: "bear", s: 2 });
  }
  return res;
}
