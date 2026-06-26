import { isRealTradeSignal } from "@/lib/analytics/winRate";
import { isNewsBlocked } from "../v8/news";
import { isWeekendMarket } from "../session";
import type { ComputedSignal } from "../types";
import { V10_CONFIG } from "./config";
import { evaluateHtfBias } from "./htfBias";
import {
  extractIndicatorSnapshot,
  validateBollinger,
  validateCandleConfirmation,
  validateFormingMomentum,
  validateMacdSlope,
  validateRsiMomentum,
  validateStochastic,
} from "./indicators";
import { getPairRuleAdjustments, validateGbpUsdCallCaps } from "./pairRules";
import { classifyStrategyType, isStrategyAllowedFor5MinLive } from "./strategyType";
import {
  evaluateTiming,
  isManualLiveWindow,
  isPendingEligibleWindow,
  isSessionAllowedForV10,
} from "./timing";
import type { ApplyV10Options, EntryMethod, V10Layer, V10TimingStatus } from "./types";

function tfKey(tf: string): "5min" | "15min" {
  return tf === "15min" ? "15min" : "5min";
}

function mergeBlockers(existing: string[] | undefined, next: string[]): string[] {
  return [...new Set([...(existing || []), ...next])];
}

function downgradeLayer(quality: number): V10Layer {
  if (quality >= V10_CONFIG.practiceMinQuality) return "PRACTICE";
  if (quality >= V10_CONFIG.radarMinQuality) return "RADAR";
  return "REJECTED";
}

function entryMs(sig: { entryAtIso?: string; tf: string }, now: Date): number {
  if (sig.entryAtIso) return new Date(sig.entryAtIso).getTime();
  const ms = parseInt(sig.tf, 10) * 60_000;
  return Math.ceil(now.getTime() / ms) * ms;
}

function secondsToEntry(sig: { entryAtIso?: string; tf: string }, now: Date): number {
  return Math.round((entryMs(sig, now) - now.getTime()) / 1000);
}

function secondsSinceEntry(sig: { entryAtIso?: string; tf: string }, now: Date): number {
  return Math.round((now.getTime() - entryMs(sig, now)) / 1000);
}

function runStrictChecks(
  sig: ComputedSignal,
  entryMethod: EntryMethod,
  opts: ApplyV10Options,
): string[] {
  const blockers: string[] = [];
  const tf = tfKey(sig.tf);
  const jpy = sig.pair.includes("JPY");
  const snap = extractIndicatorSnapshot(sig);
  if (!snap) return ["Insufficient candle history"];

  const pairAdj = getPairRuleAdjustments(sig, opts.allowEurGbp5Min ?? false);
  blockers.push(...pairAdj.extraBlockers);

  if (pairAdj.block5MinLive && entryMethod === "manual") return blockers;
  if (pairAdj.block5MinPending && entryMethod === "pending_order") return blockers;

  const thresholds =
    entryMethod === "pending_order" ? V10_CONFIG.pending[tf] : V10_CONFIG.manual[tf];
  const minGap = thresholds.scoreGap + pairAdj.scoreGapBonus;
  const minAdx = thresholds.adx + pairAdj.adxBonus;

  if (sig.scoreGap < minGap) blockers.push(`Score gap weak (${sig.scoreGap} < ${minGap})`);
  if (sig.conf < thresholds.setupQuality) {
    blockers.push(`Setup quality below ${thresholds.setupQuality}%`);
  }
  if (snap.adx < minAdx) blockers.push(`ADX below ${minAdx}`);
  if (snap.closedBodyRatio < thresholds.candleBodyRatio) {
    blockers.push("Candle body below threshold");
  }

  for (const check of [
    validateStochastic(sig.direction, snap),
    validateRsiMomentum(sig.direction, snap),
    validateMacdSlope(sig.direction, snap, jpy),
    validateCandleConfirmation(sig.direction, snap, thresholds.candleBodyRatio),
    validateBollinger(sig.direction, snap),
    validateGbpUsdCallCaps(sig, snap),
  ]) {
    if (!check.ok && check.reason) blockers.push(check.reason);
  }

  if (sig.tf === "5min") {
    const htf = evaluateHtfBias(opts.htfCandlesByPair.get(sig.pair), sig.direction);
    if (!htf.ok) blockers.push(htf.status);
  }

  const strategy = classifyStrategyType(sig);
  if (sig.tf === "5min" && !isStrategyAllowedFor5MinLive(strategy)) {
    blockers.push(`Strategy ${strategy} not allowed for 5min live/pending`);
  }

  if (isWeekendMarket(opts.now)) blockers.push("Weekend / thin market");
  if (!isSessionAllowedForV10(sig.tf, opts.now || new Date(), opts.sessionFilter)) {
    blockers.push("Outside strict session window");
  }
  const news = isNewsBlocked();
  if (news) blockers.push(`News-risk window active: ${news.name}`);
  if (sig.sidewaysMarket) blockers.push("Ranging/choppy market");

  return blockers;
}

function baseMeta(sig: ComputedSignal, options: ApplyV10Options, now: Date) {
  const entryMethod = options.entryMethod;
  const timingStatus = evaluateTiming(entryMethod, sig.tf, sig, now);
  const strategyType = classifyStrategyType(sig);
  const htf =
    sig.tf === "5min"
      ? evaluateHtfBias(options.htfCandlesByPair.get(sig.pair), sig.direction)
      : { ok: true, status: "N/A (15m signal)", ema9: 0, ema21: 0, slope: 0 };

  return {
    entryMethod,
    v10TimingStatus: timingStatus as V10TimingStatus,
    v10StrategyType: strategyType,
    htfBiasStatus: htf.status,
    setupQuality: sig.conf,
    v10Readiness: sig.v9Readiness ?? sig.conf,
    signalDetectedAt: now.toISOString(),
  };
}

/** V10 validator — runs after V9; can only downgrade, never upgrade weak signals. */
export function applyV10Layer(sig: ComputedSignal, options: ApplyV10Options): ComputedSignal {
  const now = options.now || new Date();
  const meta = baseMeta(sig, options, now);
  const entryMethod = options.entryMethod;

  if (sig.v9Layer !== "LIVE" || !isRealTradeSignal(sig.signalType, sig.grade, "LIVE")) {
    const v10Layer: V10Layer =
      sig.v9Layer === "REJECTED"
        ? "REJECTED"
        : sig.v9Layer === "PRACTICE"
          ? "PRACTICE"
          : sig.v9Layer === "RADAR"
            ? "RADAR"
            : downgradeLayer(sig.conf);

    return {
      ...sig,
      ...meta,
      v10Layer,
      v10Blockers: sig.blockers || [],
    };
  }

  let v10Blockers = runStrictChecks(sig, entryMethod, { ...options, now });
  let finalTiming = meta.v10TimingStatus;
  let v10Layer: V10Layer = downgradeLayer(sig.conf);

  if (entryMethod === "manual") {
    if (!isManualLiveWindow(sig.tf, sig, now)) {
      v10Blockers = mergeBlockers(v10Blockers, [
        finalTiming === "SIGNAL EXPIRED"
          ? "Outside valid manual entry window"
          : finalTiming === "CAUTION WINDOW"
            ? "Manual entry caution window — not live permission"
            : "Outside valid manual entry window",
      ]);
    } else {
      const snap = extractIndicatorSnapshot(sig);
      if (snap) {
        const forming = validateFormingMomentum(sig.direction, snap);
        if (!forming.ok && forming.reason) v10Blockers.push(forming.reason);
      }
      if (v10Blockers.length === 0) {
        v10Layer = "LIVE";
        finalTiming = "LIVE TRADE PERMISSION";
      }
    }
  } else if (isPendingEligibleWindow(sig.tf, sig, now)) {
    if (v10Blockers.length === 0) {
      v10Layer = "PENDING_ORDER_ELIGIBLE";
      finalTiming =
        finalTiming === "FINAL VALIDATION REQUIRED"
          ? "FINAL VALIDATION REQUIRED"
          : "PENDING ORDER ELIGIBLE";
    } else {
      v10Blockers = mergeBlockers(v10Blockers, ["Pending rules not met"]);
    }
  } else {
    v10Blockers = mergeBlockers(v10Blockers, [
      finalTiming === "SETUP FORMING"
        ? "Too early for pending order"
        : "Outside pending placement window",
    ]);
    if (finalTiming === "SETUP FORMING") v10Layer = "RADAR";
  }

  if (v10Layer !== "LIVE" && v10Layer !== "PENDING_ORDER_ELIGIBLE") {
    v10Layer = downgradeLayer(sig.conf);
  }

  const validUntilSec =
    entryMethod === "manual"
      ? Math.max(
          0,
          V10_CONFIG.manual[tfKey(sig.tf)].entryCloseSec - secondsSinceEntry(sig, now),
        )
      : Math.max(0, secondsToEntry(sig, now));

  return {
    ...sig,
    ...meta,
    v10Layer,
    v10TimingStatus: finalTiming,
    v10Blockers,
    validUntilSec,
    v9Blocker: v10Blockers[0] || sig.v9Blocker,
    v9NextCondition: v10Blockers[0] || sig.v9NextCondition,
    entryNote:
      v10Layer === "PENDING_ORDER_ELIGIBLE"
        ? "Place pending order for planned entry time · verify platform quote"
        : v10Layer === "LIVE"
          ? "Enter only inside valid window · verify platform quote"
          : sig.entryNote,
  };
}

export function applyV10Layers(
  signals: ComputedSignal[],
  options: ApplyV10Options,
): ComputedSignal[] {
  return signals.map((s) => applyV10Layer(s, options));
}

export function isV10LiveDisplay(sig: ComputedSignal): boolean {
  return sig.v10Layer === "LIVE";
}

export function isV10PendingDisplay(sig: ComputedSignal): boolean {
  return sig.v10Layer === "PENDING_ORDER_ELIGIBLE";
}

export function shouldJournalV10Signal(sig: ComputedSignal): boolean {
  return (
    sig.v10Layer === "LIVE" ||
    sig.v10Layer === "PENDING_ORDER_ELIGIBLE" ||
    sig.v10Layer === "PRACTICE"
  );
}

export function filterByShowSignalsV10(
  signals: ComputedSignal[],
  filter: "all" | "live" | "practice_live",
): ComputedSignal[] {
  if (filter === "live") {
    return signals.filter((s) => s.v10Layer === "LIVE" || s.v10Layer === "PENDING_ORDER_ELIGIBLE");
  }
  if (filter === "practice_live") {
    return signals.filter(
      (s) =>
        s.v10Layer === "LIVE" ||
        s.v10Layer === "PENDING_ORDER_ELIGIBLE" ||
        s.v10Layer === "PRACTICE",
    );
  }
  return signals;
}
