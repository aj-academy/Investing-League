import type { EntryMethod, V10TimingStatus } from "./types";
import { V10_CONFIG } from "./config";

function tfKey(tf: string): "5min" | "15min" {
  return tf === "15min" ? "15min" : "5min";
}

function entryMs(sig: { entryAtIso?: string; tf: string }, now: Date): number {
  if (sig.entryAtIso) return new Date(sig.entryAtIso).getTime();
  const ms = parseInt(sig.tf, 10) * 60_000;
  return Math.ceil(now.getTime() / ms) * ms;
}

export function secondsToEntry(sig: { entryAtIso?: string; tf: string }, now: Date): number {
  return Math.round((entryMs(sig, now) - now.getTime()) / 1000);
}

export function secondsSinceEntry(sig: { entryAtIso?: string; tf: string }, now: Date): number {
  return Math.round((now.getTime() - entryMs(sig, now)) / 1000);
}

export function evaluateManualTiming(
  tf: string,
  sig: { entryAtIso?: string; tf: string },
  now: Date,
): V10TimingStatus {
  const key = tfKey(tf);
  const cfg = V10_CONFIG.manual[key];
  const toEntry = secondsToEntry(sig, now);
  const sinceEntry = secondsSinceEntry(sig, now);

  if (toEntry > 0) return "PREPARE SIGNAL";
  if (sinceEntry < cfg.entryOpenSec) return "PREPARE SIGNAL";
  if (sinceEntry <= cfg.entryCloseSec) return "ENTRY WINDOW OPEN";
  if (sinceEntry <= cfg.cautionCloseSec) return "CAUTION WINDOW";
  if (sinceEntry > cfg.cautionCloseSec) return "SIGNAL EXPIRED";
  return "WAIT NEXT CANDLE";
}

export function isManualLiveWindow(tf: string, sig: { entryAtIso?: string; tf: string }, now: Date): boolean {
  const status = evaluateManualTiming(tf, sig, now);
  return status === "ENTRY WINDOW OPEN";
}

export function evaluatePendingTiming(
  tf: string,
  sig: { entryAtIso?: string; tf: string },
  now: Date,
): V10TimingStatus {
  const key = tfKey(tf);
  const cfg = V10_CONFIG.pending[key];
  const toEntry = secondsToEntry(sig, now);

  if (toEntry <= 0) {
    const sinceEntry = secondsSinceEntry(sig, now);
    if (sinceEntry > parseInt(tf, 10) * 60) return "ORDER EXPIRED";
    return "ENTRY TIME REACHED";
  }

  if (toEntry > cfg.setupWindowStartSec) return "SETUP FORMING";
  if (toEntry >= cfg.finalValidationEndSec && toEntry <= cfg.finalValidationStartSec) {
    return "FINAL VALIDATION REQUIRED";
  }
  if (toEntry >= cfg.bestEndSec && toEntry <= cfg.bestStartSec) return "PENDING ORDER ELIGIBLE";
  if (toEntry >= cfg.setupWindowEndSec && toEntry < cfg.bestEndSec) return "PENDING ORDER CAUTION";
  if (toEntry < cfg.setupWindowEndSec) return "ORDER EXPIRED";
  return "SETUP FORMING";
}

export function isPendingEligibleWindow(
  tf: string,
  sig: { entryAtIso?: string; tf: string },
  now: Date,
): boolean {
  const toEntry = secondsToEntry(sig, now);
  if (toEntry <= 0) return false;
  const cfg = V10_CONFIG.pending[tfKey(tf)];
  // ~1 min before entry through final validation (matches pending-order workflow)
  return toEntry >= cfg.finalValidationEndSec && toEntry <= cfg.setupWindowStartSec;
}

export function evaluateTiming(
  entryMethod: EntryMethod,
  tf: string,
  sig: { entryAtIso?: string; tf: string },
  now: Date,
): V10TimingStatus {
  return entryMethod === "pending_order"
    ? evaluatePendingTiming(tf, sig, now)
    : evaluateManualTiming(tf, sig, now);
}

export function isSessionAllowedForV10(
  tf: string,
  now: Date,
  sessionFilter = "any",
): boolean {
  const h = now.getUTCHours() + now.getUTCMinutes() / 60;
  if (sessionFilter === "london") return h >= 8 && h < 17;
  if (sessionFilter === "newyork") return h >= 13 && h < 22;
  if (sessionFilter === "overlap") return h >= 12 && h < 17;
  const cfg = V10_CONFIG.session[tfKey(tf)];
  return h >= cfg.startUtcHour && h < cfg.endUtcHour;
}

export function isBestSession15m(now: Date): boolean {
  const h = now.getUTCHours() + now.getUTCMinutes() / 60;
  const cfg = V10_CONFIG.session["15min"];
  return h >= cfg.bestStartUtcHour! && h < cfg.bestEndUtcHour!;
}
