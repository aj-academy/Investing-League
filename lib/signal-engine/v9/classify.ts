import { isRealTradeSignal } from "@/lib/analytics/winRate";
import { resolvePermission } from "../permission";
import type { ComputedSignal } from "../types";
import { isWeekendMarket } from "../session";
import type { ShowSignalsFilter, V9Layer } from "./types";

const REJECTED_TYPES = new Set([
  "LATE ENTRY",
  "REPEATED SIGNAL",
  "TREND EXHAUSTED",
  "CORRELATION RISK",
  "LIVE SELECTOR WATCH",
]);

function extractBlockers(sig: ComputedSignal): string[] {
  if (sig.blockers?.length) return sig.blockers;
  if (sig.riskNote) {
    return sig.riskNote.split(" · ").filter(Boolean);
  }
  return [];
}

function isHardRejected(sig: ComputedSignal, blockers: string[]): boolean {
  if (resolvePermission(sig) === "DO NOT TRADE") return true;
  if (REJECTED_TYPES.has(sig.signalType)) return true;
  return blockers.some((b) =>
    /late|large|against|low volatility|conflict|repeated|daily limit|trend exhausted|correlation/i.test(
      b,
    ),
  );
}

function computeReadiness(sig: ComputedSignal, blockers: string[]): number {
  let readiness = Math.round(
    sig.conf + Math.min(10, Math.max(0, sig.scoreGap - 8)) - Math.min(18, blockers.length * 4),
  );
  return Math.max(20, Math.min(99, readiness));
}

function nextCondition(blockers: string[], sig: ComputedSignal): string {
  const primary = blockers[0] || sig.signalReason || "Waiting for stronger confirmation";
  if (/gap/i.test(primary)) return "Waiting for clearer score gap between CALL and PUT";
  if (/volatility|adx/i.test(primary)) return "Waiting for ATR and ADX to improve";
  if (/conflict/i.test(primary)) return "Waiting for EMA and WMA to align";
  if (/late|overextended|large/i.test(primary)) return "Waiting for a fresher candle entry";
  if (/candle direction/i.test(primary)) return "Waiting for candle to match direction";
  if (/bollinger/i.test(primary)) return "Waiting for price to leave extended Bollinger zone";
  return primary.replace(/\.$/, "");
}

/** Classify one signal — does not change V8 permission thresholds. */
export function classifyV9Layer(sig: ComputedSignal, weekend = isWeekendMarket()): ComputedSignal {
  const blockers = extractBlockers(sig);
  const permission = resolvePermission(sig);
  const liveEligible =
    permission === "TRADE ALLOWED" && isRealTradeSignal(sig.signalType, sig.grade);

  let v9Layer: V9Layer;
  let v9Blocker = blockers[0] || sig.signalReason || "";
  let readiness = 100;

  if (liveEligible && !weekend) {
    v9Layer = "LIVE";
    v9Blocker = "";
  } else if (liveEligible && weekend) {
    v9Layer = "REJECTED";
    v9Blocker = "Weekend / thin market — live trading blocked";
    readiness = computeReadiness(sig, blockers);
  } else if (isHardRejected(sig, blockers)) {
    v9Layer = "REJECTED";
    readiness = computeReadiness(sig, blockers);
  } else if (sig.conf >= 68 && sig.grade !== "C") {
    v9Layer = "PRACTICE";
    readiness = Math.min(88, computeReadiness(sig, blockers));
  } else {
    v9Layer = "RADAR";
    readiness = computeReadiness(sig, blockers);
  }

  return {
    ...sig,
    blockers,
    v9Layer,
    v9Readiness: readiness,
    v9Blocker: v9Blocker.replace(/\.$/, ""),
    v9NextCondition: nextCondition(blockers, sig),
  };
}

export function applyV9Layers(
  signals: ComputedSignal[],
  weekend = isWeekendMarket(),
): ComputedSignal[] {
  return signals.map((s) => classifyV9Layer(s, weekend));
}

export function filterByShowSignals(
  signals: ComputedSignal[],
  filter: ShowSignalsFilter,
): ComputedSignal[] {
  if (filter === "live") {
    return signals.filter((s) => s.v9Layer === "LIVE");
  }
  if (filter === "practice_live") {
    return signals.filter((s) => s.v9Layer === "LIVE" || s.v9Layer === "PRACTICE");
  }
  return signals;
}

export function isV9LiveDisplay(sig: ComputedSignal): boolean {
  return sig.v9Layer === "LIVE";
}

export function shouldJournalV9Signal(sig: ComputedSignal): boolean {
  return sig.v9Layer === "LIVE" || sig.v9Layer === "PRACTICE";
}
