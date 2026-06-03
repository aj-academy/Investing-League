import type { OHLC, Pattern } from "../types";

function candleStats(c: OHLC) {
  const range = Math.max(c.high - c.low, 1e-10);
  const body = Math.abs(c.close - c.open);
  const upper = c.high - Math.max(c.open, c.close);
  const lower = Math.min(c.open, c.close) - c.low;
  return {
    body,
    bodyRatio: (body / range) * 100,
    bull: c.close > c.open,
    bear: c.close < c.open,
    upper,
    lower,
  };
}

/** V8 HTML detectPatterns — matches single-file reference. */
export function detectPatternsV8(ohlc: OHLC[]): Pattern[] {
  const n = ohlc.length;
  if (n < 5) return [];
  const r: Pattern[] = [];
  const c2 = ohlc[n - 2];
  const c3 = ohlc[n - 3];
  const c4 = ohlc[n - 4];
  const st = candleStats(c2);
  const s3 = candleStats(c3);
  const s4 = candleStats(c4);

  if (st.lower > 2 * st.body && st.upper < st.body * 0.6)
    r.push({ n: "Hammer / Bull Pin Bar", d: "bull", s: 2 });
  if (st.upper > 2 * st.body && st.lower < st.body * 0.6)
    r.push({ n: "Shooting Star / Bear Pin Bar", d: "bear", s: 2 });
  if (st.bodyRatio < 7) r.push({ n: "Doji", d: "neutral", s: 1 });
  if (s3.bear && st.bull && c2.open <= c3.close && c2.close >= c3.open)
    r.push({ n: "Bull Engulfing", d: "bull", s: 3 });
  if (s3.bull && st.bear && c2.open >= c3.close && c2.close <= c3.open)
    r.push({ n: "Bear Engulfing", d: "bear", s: 3 });
  if (s4.bear && s3.body < s4.body * 0.35 && st.bull && c2.close > (c4.open + c4.close) / 2)
    r.push({ n: "Morning Star", d: "bull", s: 3 });
  if (s4.bull && s3.body < s4.body * 0.35 && st.bear && c2.close < (c4.open + c4.close) / 2)
    r.push({ n: "Evening Star", d: "bear", s: 3 });
  return r;
}
