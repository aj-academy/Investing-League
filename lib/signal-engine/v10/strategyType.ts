import type { ComputedSignal } from "../types";
import type { V10StrategyType } from "./types";

export function classifyStrategyType(sig: ComputedSignal): V10StrategyType {
  const blockers = sig.blockers || [];
  const blockerText = blockers.join(" ").toLowerCase();

  if (
    blockerText.includes("overextended") ||
    blockerText.includes("late entry") ||
    blockerText.includes("bollinger trend ride")
  ) {
    return "EXHAUSTION_RISK";
  }

  if (sig.sidewaysMarket || Number(sig.adx) < 16) {
    return "RANGE_REVERSAL";
  }

  const pullback =
    (sig.direction === "CALL" && sig.emaBullTrend && !sig.overExtendedBull) ||
    (sig.direction === "PUT" && sig.emaBearTrend && !sig.overExtendedBear);

  if (pullback && sig.scoreGap >= 6) {
    return "TREND_PULLBACK";
  }

  if (
    sig.candleStrengthText === "STRONG" &&
    Number(sig.adx) >= 22 &&
    !sig.bigCandle &&
    sig.emaWmaBias !== "Mixed"
  ) {
    return "MOMENTUM_BREAKOUT";
  }

  if (blockerText.includes("pullback") || blockerText.includes("support") || blockerText.includes("resistance")) {
    return "TREND_PULLBACK";
  }

  return "UNKNOWN";
}

export function isStrategyAllowedFor5MinLive(strategy: V10StrategyType): boolean {
  return strategy === "MOMENTUM_BREAKOUT" || strategy === "TREND_PULLBACK";
}
