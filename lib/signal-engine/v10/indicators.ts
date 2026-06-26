import { M } from "../indicators";
import type { ComputedSignal, Direction, OHLC } from "../types";
import { V10_CONFIG } from "./config";

export interface IndicatorSnapshot {
  rsi: number;
  rsiPrev: number;
  rsiPrev2: number;
  stochK: number;
  stochD: number;
  stochKPrev: number;
  stochDPrev: number;
  macdLine: number;
  macdSignal: number;
  macdHist: number;
  macdHistPrev: number;
  bbPB: number;
  adx: number;
  closedBull: boolean;
  closedBear: boolean;
  closedBodyRatio: number;
  formingBull: boolean;
  formingBear: boolean;
  isDoji: boolean;
}

export function extractIndicatorSnapshot(sig: ComputedSignal): IndicatorSnapshot | null {
  const ohlc = sig.ohlc;
  if (ohlc.length < 90) return null;

  const is5 = sig.tf === "5min";
  const c = ohlc.map((x) => x.close);
  const n = c.length;
  const i = n - 2;
  const forming = n - 1;

  const rsiArr = M.rsi(c, is5 ? 9 : 14);
  const mac = M.macd(c);
  const st = M.stoch(ohlc, is5 ? 5 : 14, 3);
  const bb = M.bb(c, 20, 2);

  const closed = ohlc[i];
  const range = Math.max(closed.high - closed.low, 1e-10);
  const body = Math.abs(closed.close - closed.open);
  const closedBodyRatio = (body / range) * 100;

  return {
    rsi: rsiArr[i] as number,
    rsiPrev: rsiArr[i - 1] as number,
    rsiPrev2: rsiArr[i - 2] as number,
    stochK: st.K[i] as number,
    stochD: st.D[i] as number,
    stochKPrev: st.K[i - 1] as number,
    stochDPrev: st.D[i - 1] as number,
    macdLine: mac.line[i] as number,
    macdSignal: mac.signal[i] as number,
    macdHist: mac.hist[i] as number,
    macdHistPrev: mac.hist[i - 1] as number,
    bbPB: bb.pB[i] as number,
    adx: Number(sig.adx) || 0,
    closedBull: closed.close > closed.open,
    closedBear: closed.close < closed.open,
    closedBodyRatio,
    formingBull: ohlc[forming].close >= ohlc[forming].open,
    formingBear: ohlc[forming].close <= ohlc[forming].open,
    isDoji: closedBodyRatio < 12,
  };
}

export function validateStochastic(direction: Direction, s: IndicatorSnapshot): { ok: boolean; reason?: string } {
  const { stochK, stochD, stochKPrev, stochDPrev } = s;

  if (direction === "CALL") {
    if (stochK > V10_CONFIG.stochCallBlock) {
      return { ok: false, reason: "Stochastic overextended for CALL" };
    }
    const crossover =
      stochKPrev <= stochDPrev && stochK > stochD && stochKPrev <= 35 && stochK <= 80;
    const momentum =
      stochK > stochD &&
      stochK > stochKPrev &&
      stochD >= stochDPrev &&
      stochK >= 35 &&
      stochK <= 80;
    if (crossover || momentum) return { ok: true };
    return { ok: false, reason: "Stochastic confirmation missing" };
  }

  if (stochK < V10_CONFIG.stochPutBlock) {
    return { ok: false, reason: "Stochastic overextended for PUT" };
  }
  const crossover =
    stochKPrev >= stochDPrev && stochK < stochD && stochKPrev >= 65 && stochK >= 20;
  const momentum =
    stochK < stochD &&
    stochK < stochKPrev &&
    stochD <= stochDPrev &&
    stochK <= 65 &&
    stochK >= 20;
  if (crossover || momentum) return { ok: true };
  return { ok: false, reason: "Stochastic confirmation missing" };
}

export function validateRsiMomentum(direction: Direction, s: IndicatorSnapshot): { ok: boolean; reason?: string } {
  if (direction === "CALL") {
    if (s.rsi > V10_CONFIG.rsiCallMax) return { ok: false, reason: "RSI overextended for CALL" };
    const ok =
      s.rsi >= V10_CONFIG.rsiCallMin && s.rsi > s.rsiPrev && s.rsiPrev >= s.rsiPrev2;
    return ok ? { ok: true } : { ok: false, reason: "RSI momentum not confirmed" };
  }
  if (s.rsi < V10_CONFIG.rsiPutMin) return { ok: false, reason: "RSI overextended for PUT" };
  const ok = s.rsi <= V10_CONFIG.rsiPutMax && s.rsi < s.rsiPrev && s.rsiPrev <= s.rsiPrev2;
  return ok ? { ok: true } : { ok: false, reason: "RSI momentum not confirmed" };
}

export function validateMacdSlope(
  direction: Direction,
  s: IndicatorSnapshot,
  jpy: boolean,
): { ok: boolean; reason?: string } {
  const flatTh = jpy ? V10_CONFIG.macdFlatJpy : V10_CONFIG.macdFlatNonJpy;
  if (Math.abs(s.macdHist - s.macdHistPrev) < flatTh) {
    return { ok: false, reason: "MACD momentum slope weak" };
  }
  if (direction === "CALL") {
    const ok = s.macdLine > s.macdSignal && s.macdHist > 0 && s.macdHist > s.macdHistPrev;
    return ok ? { ok: true } : { ok: false, reason: "MACD momentum slope weak" };
  }
  const ok = s.macdLine < s.macdSignal && s.macdHist < 0 && s.macdHist < s.macdHistPrev;
  return ok ? { ok: true } : { ok: false, reason: "MACD momentum slope weak" };
}

export function validateCandleConfirmation(
  direction: Direction,
  s: IndicatorSnapshot,
  minBodyRatio: number,
): { ok: boolean; reason?: string } {
  if (s.isDoji) return { ok: false, reason: "Weak confirmation candle" };
  if (direction === "CALL") {
    if (!s.closedBull || s.closedBodyRatio < minBodyRatio) {
      return { ok: false, reason: "Weak confirmation candle" };
    }
    return { ok: true };
  }
  if (!s.closedBear || s.closedBodyRatio < minBodyRatio) {
    return { ok: false, reason: "Weak confirmation candle" };
  }
  return { ok: true };
}

export function validateBollinger(direction: Direction, s: IndicatorSnapshot): { ok: boolean; reason?: string } {
  if (direction === "CALL" && s.bbPB >= V10_CONFIG.bbCallBlock) {
    return { ok: false, reason: "Price overextended near Bollinger extreme" };
  }
  if (direction === "PUT" && s.bbPB <= V10_CONFIG.bbPutBlock) {
    return { ok: false, reason: "Price overextended near Bollinger extreme" };
  }
  return { ok: true };
}

export function validateFormingMomentum(
  direction: Direction,
  s: IndicatorSnapshot,
): { ok: boolean; reason?: string } {
  if (direction === "CALL" && !s.formingBull) {
    return { ok: false, reason: "Current candle momentum against signal" };
  }
  if (direction === "PUT" && !s.formingBear) {
    return { ok: false, reason: "Current candle momentum against signal" };
  }
  return { ok: true };
}
