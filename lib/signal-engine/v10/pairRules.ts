import type { ComputedSignal } from "../types";
import type { IndicatorSnapshot } from "./indicators";

export interface PairRuleAdjustments {
  scoreGapBonus: number;
  adxBonus: number;
  block5MinLive: boolean;
  block5MinPending: boolean;
  extraBlockers: string[];
}

export function getPairRuleAdjustments(
  sig: ComputedSignal,
  allowEurGbp5Min: boolean,
): PairRuleAdjustments {
  const adj: PairRuleAdjustments = {
    scoreGapBonus: 0,
    adxBonus: 0,
    block5MinLive: false,
    block5MinPending: false,
    extraBlockers: [],
  };

  const is5 = sig.tf === "5min";

  if (sig.pair === "GBP/USD" && is5) {
    if (sig.direction === "CALL") adj.scoreGapBonus += 2;
    adj.adxBonus += 2;
  }

  if (sig.pair === "EUR/GBP") {
    adj.scoreGapBonus += 3;
    adj.adxBonus += 3;
    if (is5 && !allowEurGbp5Min) {
      adj.block5MinLive = true;
      adj.block5MinPending = true;
      adj.extraBlockers.push("EUR/GBP 5min restricted in strict mode");
    }
  }

  if (sig.pair === "GBP/USD" && is5 && sig.direction === "CALL" && sig.ohlc.length > 0) {
    // RSI/Stoch checked in indicator validation; pair-specific caps at validation time
  }

  return adj;
}

export function validateGbpUsdCallCaps(
  sig: ComputedSignal,
  snap: IndicatorSnapshot,
): { ok: boolean; reason?: string } {
  if (sig.pair !== "GBP/USD" || sig.tf !== "5min" || sig.direction !== "CALL") {
    return { ok: true };
  }
  if (snap.rsi > 70) return { ok: false, reason: "GBP/USD CALL blocked — RSI > 70" };
  if (snap.stochK > 82) return { ok: false, reason: "GBP/USD CALL blocked — Stoch > 82" };
  return { ok: true };
}
