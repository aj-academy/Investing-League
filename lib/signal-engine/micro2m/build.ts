import { formatAppTime, resolveTimeZone } from "@/lib/datetime";
import type { ComputedSignal, OHLC } from "../types";
import { classify2MMicroSignal } from "./classify";
import { MICRO_2M_CONFIG } from "./config";
import { rank2MMicroSignals } from "./rank";
import type { Micro2MSignal } from "./types";

/** Next 2-minute candle open + expiry (+2 min) for platform entry. */
export function compute2MEntryWindow(timeZone?: string, asOf = Date.now()) {
  const tz = resolveTimeZone(timeZone);
  const bucketMs = 2 * 60_000;
  const entry = new Date(Math.ceil(asOf / bucketMs) * bucketMs);
  const expiry = new Date(entry.getTime() + bucketMs);
  return {
    entryTime: formatAppTime(entry, tz),
    expTime: formatAppTime(expiry, tz),
    entryAtIso: entry.toISOString(),
    expAtIso: expiry.toISOString(),
  };
}

function toMicroCard(
  sig: ComputedSignal,
  micro: ReturnType<typeof classify2MMicroSignal>,
  opts: {
    id: string;
    isBest?: boolean;
    forceAvoid?: boolean;
    timeZone?: string;
  },
): Micro2MSignal {
  const window = compute2MEntryWindow(opts.timeZone);
  return {
    id: opts.id,
    pair: sig.pair,
    direction: sig.direction,
    sourceTf: sig.tf,
    sourceLayer: sig.v9Layer ?? null,
    grade: sig.grade,
    conf: sig.conf,
    score: sig.score,
    scoreGap: sig.scoreGap,
    microReadiness: micro.microReadiness,
    microPermission: opts.forceAvoid ? "2M_AVOID" : micro.microPermission,
    microLabel: opts.forceAvoid ? "2M AVOID" : micro.microLabel,
    microReason: micro.microReason,
    microAction: micro.microAction,
    candleAligned: micro.candleAligned,
    candleBodyRatio: micro.candleBodyRatio,
    isDoji: micro.isDoji,
    oneMinuteStatus: micro.oneMinuteStatus,
    oneMinuteNote: micro.oneMinuteNote,
    expiryLabel: MICRO_2M_CONFIG.expiryLabel,
    // Always 2-minute platform clock — not the 5/15 chart entry
    entryTime: window.entryTime,
    expTime: window.expTime,
    price: sig.price ?? null,
    strategyType: "2M_MICRO",
    entryMethod: "manual_2m",
    isBest: Boolean(opts.isBest),
    warnings: micro.warnings,
    sourceSignalUid: sig.signalUid,
  };
}

/** Build ranked 2M Micro cards from existing V9-classified signals. */
export function build2MMicroSignals(
  signals: ComputedSignal[],
  oneMinByPair?: Map<string, OHLC[]> | Record<string, OHLC[]>,
  options?: { timeZone?: string },
): Micro2MSignal[] {
  if (!MICRO_2M_CONFIG.enabled || !signals.length) return [];

  const getOneMin = (pair: string): OHLC[] | null => {
    if (!oneMinByPair) return null;
    if (oneMinByPair instanceof Map) return oneMinByPair.get(pair) ?? null;
    return oneMinByPair[pair] ?? null;
  };

  // Prefer one candidate per pair: best readiness among TFs
  const byPair = new Map<string, ComputedSignal>();
  for (const sig of signals) {
    const prev = byPair.get(sig.pair);
    const prevR = prev ? Number(prev.v9Readiness ?? prev.conf) : -1;
    const nextR = Number(sig.v9Readiness ?? sig.conf);
    if (!prev || nextR > prevR) byPair.set(sig.pair, sig);
  }

  const classified: Micro2MSignal[] = [];
  for (const sig of byPair.values()) {
    if (MICRO_2M_CONFIG.avoidPairs.includes(sig.pair)) continue;
    const micro = classify2MMicroSignal(sig, getOneMin(sig.pair));
    classified.push(
      toMicroCard(sig, micro, {
        id: `2m_${sig.signalUid}`,
        timeZone: options?.timeZone,
      }),
    );
  }

  // Ensure section never blank after scan when any V9 candidates existed
  if (!classified.length && signals[0]) {
    const sig = signals[0];
    const micro = classify2MMicroSignal(sig, getOneMin(sig.pair));
    classified.push(
      toMicroCard(sig, micro, {
        id: `2m_fallback_${sig.signalUid}`,
        isBest: true,
        forceAvoid: true,
        timeZone: options?.timeZone,
      }),
    );
  }

  return rank2MMicroSignals(classified);
}

export function build2MRiskWarning(
  rows: { result?: string | null; strategy_type?: string | null; entry_method?: string | null }[],
): string | null {
  const micro = rows.filter(
    (r) => r.strategy_type === "2M_MICRO" || r.entry_method === "manual_2m",
  );
  const losses = micro.filter((r) => r.result === "Loss");
  if (losses.length >= MICRO_2M_CONFIG.stopAfterLosses) {
    return "2M daily loss limit reached. Stop real trades and use observation only.";
  }

  // Consecutive from newest-first journal
  let streak = 0;
  for (const r of micro) {
    if (r.result === "Loss") streak++;
    else if (r.result === "Win" || r.result === "Refund") break;
  }
  if (streak >= MICRO_2M_CONFIG.stopAfterConsecutiveLosses) {
    return "Two consecutive 2M losses. Stop trading for the day.";
  }
  return null;
}
