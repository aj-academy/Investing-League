import type { ComputedSignal } from "../types";
import { applyV10Permission, rankV10Signals } from "./permission";
import type { ApplyV10Options, V10Permission } from "./types";

export { applyV10Permission, rankV10Signals } from "./permission";

/** Apply V10 permission + rank top setups (runs after V9, keeps v9Layer). */
export function applyV10Layers(
  signals: ComputedSignal[],
  options: ApplyV10Options,
): ComputedSignal[] {
  const permitted = applyV10Permission(signals, options);
  return rankV10Signals(permitted);
}

export function isV10LiveDisplay(sig: ComputedSignal): boolean {
  return sig.v10Permission === "TRADE_ALLOWED" || sig.v10Layer === "LIVE";
}

export function isV10PendingDisplay(sig: ComputedSignal): boolean {
  return (
    sig.v10Permission === "PENDING_ORDER_SIGNAL" || sig.v10Layer === "PENDING_ORDER_ELIGIBLE"
  );
}

export function isV10TradeTier(sig: ComputedSignal): boolean {
  return isV10LiveDisplay(sig) || isV10PendingDisplay(sig);
}

export function shouldJournalV10Signal(sig: ComputedSignal): boolean {
  const p = sig.v10Permission;
  if (p === "AVOID_TRADE") return false;
  if (p === "TRADE_ALLOWED" || p === "PENDING_ORDER_SIGNAL" || p === "CAUTION_SIGNAL") {
    return true;
  }
  return sig.v10Layer === "LIVE" || sig.v10Layer === "PENDING_ORDER_ELIGIBLE" || sig.v10Layer === "PRACTICE";
}

export function filterByShowSignalsV10(
  signals: ComputedSignal[],
  filter: "all" | "live" | "practice_live",
): ComputedSignal[] {
  if (filter === "live") {
    return signals.filter(isV10TradeTier);
  }
  if (filter === "practice_live") {
    return signals.filter(
      (s) =>
        isV10TradeTier(s) ||
        s.v10Permission === "CAUTION_SIGNAL" ||
        s.v10Layer === "PRACTICE",
    );
  }
  return signals;
}

export function countByV10Permission(signals: ComputedSignal[]) {
  const count = (p: V10Permission) =>
    signals.filter((s) => s.v10Permission === p).length;
  return {
    tradeAllowed: count("TRADE_ALLOWED"),
    pendingOrder: count("PENDING_ORDER_SIGNAL"),
    caution: count("CAUTION_SIGNAL"),
    avoid: count("AVOID_TRADE"),
  };
}
