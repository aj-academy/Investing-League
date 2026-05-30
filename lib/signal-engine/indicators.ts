import type { OHLC } from "./types";
import { isNum } from "@/lib/utils";

export const M = {
  ema(a: number[], n: number) {
    const k = 2 / (n + 1);
    const o: number[] = [];
    for (let i = 0; i < a.length; i++)
      o.push(i === 0 ? a[0] : a[i] * k + o[i - 1] * (1 - k));
    return o;
  },
  wma(a: number[], n: number) {
    const o: (number | null)[] = [];
    const denom = (n * (n + 1)) / 2;
    for (let i = 0; i < a.length; i++) {
      if (i < n - 1) {
        o.push(null);
        continue;
      }
      let sum = 0;
      for (let j = 0; j < n; j++) sum += a[i - n + 1 + j] * (j + 1);
      o.push(sum / denom);
    }
    return o;
  },
  sma(a: number[], n: number) {
    return a.map((_, i) =>
      i < n - 1 ? null : a.slice(i - n + 1, i + 1).reduce((s, v) => s + v, 0) / n
    );
  },
  rsi(c: number[], n = 14) {
    if (c.length <= n) return Array(c.length).fill(null);
    const o: (number | null)[] = Array(n).fill(null);
    let ag = 0,
      al = 0;
    for (let i = 1; i <= n; i++) {
      const d = c[i] - c[i - 1];
      ag += d > 0 ? d : 0;
      al += d < 0 ? -d : 0;
    }
    ag /= n;
    al /= n;
    o.push(al === 0 ? 100 : 100 - 100 / (1 + ag / al));
    for (let i = n + 1; i < c.length; i++) {
      const d = c[i] - c[i - 1];
      ag = (ag * (n - 1) + (d > 0 ? d : 0)) / n;
      al = (al * (n - 1) + (d < 0 ? -d : 0)) / n;
      o.push(al === 0 ? 100 : 100 - 100 / (1 + ag / al));
    }
    return o;
  },
  macd(c: number[], f = 12, s = 26, sig = 9) {
    const ef = M.ema(c, f);
    const es = M.ema(c, s);
    const line = ef.map((v, i) => v - es[i]);
    const signal = M.ema(line, sig);
    const hist = line.map((v, i) => v - signal[i]);
    return { line, signal, hist };
  },
  bb(c: number[], n = 20, d = 2) {
    const up: (number | null)[] = [];
    const lo: (number | null)[] = [];
    const mid: (number | null)[] = [];
    const pB: (number | null)[] = [];
    for (let i = 0; i < c.length; i++) {
      if (i < n - 1) {
        up.push(null);
        lo.push(null);
        mid.push(null);
        pB.push(null);
        continue;
      }
      const sl = c.slice(i - n + 1, i + 1);
      const m = sl.reduce((a, b) => a + b, 0) / n;
      const std = Math.sqrt(sl.map((v) => (v - m) ** 2).reduce((a, b) => a + b, 0) / n);
      up.push(m + d * std);
      lo.push(m - d * std);
      mid.push(m);
      pB.push(std < 1e-10 ? 0.5 : (c[i] - (m - d * std)) / (2 * d * std));
    }
    return { up, lo, mid, pB };
  },
  stoch(ohlc: OHLC[], kp = 5, dp = 3) {
    const K: (number | null)[] = [];
    for (let i = 0; i < ohlc.length; i++) {
      if (i < kp - 1) {
        K.push(null);
        continue;
      }
      const sl = ohlc.slice(i - kp + 1, i + 1);
      const lo = Math.min(...sl.map((c) => c.low));
      const hi = Math.max(...sl.map((c) => c.high));
      K.push(hi === lo ? 50 : ((ohlc[i].close - lo) / (hi - lo)) * 100);
    }
    const D = K.map((_, i) => {
      if (i < kp + dp - 2) return null;
      const vs = K.slice(i - dp + 1, i + 1).filter(isNum);
      return vs.length === dp ? vs.reduce((a, b) => a + b, 0) / dp : null;
    });
    return { K, D };
  },
  atr(ohlc: OHLC[], n = 14) {
    const trs = ohlc.map((c, i) =>
      i === 0
        ? c.high - c.low
        : Math.max(
            c.high - c.low,
            Math.abs(c.high - ohlc[i - 1].close),
            Math.abs(c.low - ohlc[i - 1].close)
          )
    );
    const out: (number | null)[] = Array(Math.min(n, trs.length)).fill(null);
    if (trs.length <= n) return out;
    let a = trs.slice(0, n).reduce((x, y) => x + y, 0) / n;
    out.push(a);
    for (let i = n; i < trs.length; i++) {
      a = (a * (n - 1) + trs[i]) / n;
      out.push(a);
    }
    return out;
  },
  cci(ohlc: OHLC[], n = 20) {
    const tp = ohlc.map((c) => (c.high + c.low + c.close) / 3);
    return tp.map((_, i) => {
      if (i < n - 1) return null;
      const sl = tp.slice(i - n + 1, i + 1);
      const m = sl.reduce((a, b) => a + b, 0) / n;
      const md = sl.map((v) => Math.abs(v - m)).reduce((a, b) => a + b, 0) / n;
      return md < 1e-10 ? 0 : (tp[i] - m) / (0.015 * md);
    });
  },
  pivots(ohlc: OHLC[]) {
    const l = ohlc[ohlc.length - 2];
    const H = l.high,
      L = l.low,
      C = l.close,
      P = (H + L + C) / 3;
    return { R2: P + (H - L), R1: 2 * P - L, P, S1: 2 * P - H, S2: P - (H - L) };
  },
  swings(ohlc: OHLC[]) {
    const res: number[] = [];
    const sup: number[] = [];
    for (let i = 3; i < ohlc.length - 3; i++) {
      if (
        ohlc[i].high > ohlc[i - 1].high &&
        ohlc[i].high > ohlc[i - 2].high &&
        ohlc[i].high > ohlc[i + 1].high &&
        ohlc[i].high > ohlc[i + 2].high
      )
        res.push(ohlc[i].high);
      if (
        ohlc[i].low < ohlc[i - 1].low &&
        ohlc[i].low < ohlc[i - 2].low &&
        ohlc[i].low < ohlc[i + 1].low &&
        ohlc[i].low < ohlc[i + 2].low
      )
        sup.push(ohlc[i].low);
    }
    return { res, sup };
  },
  adx(ohlc: OHLC[], period = 14) {
    const len = ohlc.length;
    const out: (number | null)[] = Array(len).fill(null);
    if (len < period * 2 + 2) return out;
    const tr: number[] = [];
    const plusDM: number[] = [];
    const minusDM: number[] = [];
    for (let i = 1; i < len; i++) {
      const up = ohlc[i].high - ohlc[i - 1].high;
      const down = ohlc[i - 1].low - ohlc[i].low;
      plusDM.push(up > down && up > 0 ? up : 0);
      minusDM.push(down > up && down > 0 ? down : 0);
      tr.push(
        Math.max(
          ohlc[i].high - ohlc[i].low,
          Math.abs(ohlc[i].high - ohlc[i - 1].close),
          Math.abs(ohlc[i].low - ohlc[i - 1].close)
        )
      );
    }
    let trS = tr.slice(0, period).reduce((a, b) => a + b, 0);
    let pS = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
    let mS = minusDM.slice(0, period).reduce((a, b) => a + b, 0);
    const dx: number[] = [];
    for (let i = period; i < tr.length; i++) {
      trS = trS - trS / period + tr[i];
      pS = pS - pS / period + plusDM[i];
      mS = mS - mS / period + minusDM[i];
      const pDI = trS ? (100 * pS) / trS : 0;
      const mDI = trS ? (100 * mS) / trS : 0;
      const dxi = pDI + mDI ? (100 * Math.abs(pDI - mDI)) / (pDI + mDI) : 0;
      dx.push(dxi);
      if (dx.length === period) {
        out[i + 1] = dx.reduce((a, b) => a + b, 0) / period;
      } else if (dx.length > period) {
        out[i + 1] = ((out[i] || dx[dx.length - 2])! * (period - 1) + dxi) / period;
      }
    }
    return out;
  },
};
