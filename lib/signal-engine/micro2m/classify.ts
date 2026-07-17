import { isWeekendMarket } from "../session";
import type { ComputedSignal, OHLC } from "../types";
import { MICRO_2M_CONFIG } from "./config";
import type { Micro2MLabel, Micro2MPermission, OneMinuteConfirmation } from "./types";

const HARD_BLOCKER_WORDS = [
  "candle not aligned",
  "doji",
  "news",
  "weekend",
  "thin market",
  "daily limit",
  "repeated",
  "trend exhausted",
  "no direction",
  "conflict",
  "oversized candle",
];

export function get2MReadiness(signal: ComputedSignal): number {
  const direct = Number(signal.v9Readiness ?? (signal as { readiness?: number }).readiness);
  if (Number.isFinite(direct) && direct > 0) {
    return Math.max(0, Math.min(100, Math.round(direct)));
  }

  const conf = Number(signal.conf || 0);
  const score = Number(signal.score || 0);
  const gap = Math.abs(Number(signal.scoreGap || 0));
  const readiness = Math.round(0.5 * conf + 0.25 * Math.min(100, score) + 0.25 * Math.min(100, gap * 8));
  return Math.max(0, Math.min(100, readiness));
}

export function is2MCandleAligned(signal: ComputedSignal): {
  aligned: boolean;
  bodyRatio: number;
  isDoji: boolean;
  missing: boolean;
} {
  const bodyRatio = Number(signal.candleBodyRatio ?? 0);
  const hasFlags =
    typeof signal.candleBullish === "boolean" || typeof signal.candleBearish === "boolean";

  if (!hasFlags && !(signal.ohlc && signal.ohlc.length)) {
    return { aligned: false, bodyRatio, isDoji: bodyRatio < MICRO_2M_CONFIG.minBodyRatio, missing: true };
  }

  let bull = signal.candleBullish;
  let bear = signal.candleBearish;
  if ((!hasFlags || bull == null) && signal.ohlc?.length) {
    const c = signal.ohlc[signal.ohlc.length - 2] || signal.ohlc[signal.ohlc.length - 1];
    if (c) {
      bull = c.close >= c.open;
      bear = c.close <= c.open;
    }
  }

  const isDoji = bodyRatio < MICRO_2M_CONFIG.minBodyRatio;
  const aligned =
    signal.direction === "CALL"
      ? Boolean(bull) && !isDoji
      : signal.direction === "PUT"
        ? Boolean(bear) && !isDoji
        : false;

  return { aligned, bodyRatio, isDoji, missing: false };
}

export function get2MHardBlockers(signal: ComputedSignal): string[] {
  const blockers: string[] = [];
  const cfg = MICRO_2M_CONFIG;

  if (cfg.blockIfWeekend && isWeekendMarket()) {
    blockers.push("Weekend / thin market");
  }

  if (!signal.direction || (signal.direction !== "CALL" && signal.direction !== "PUT")) {
    blockers.push("No clear direction");
  }

  if (!signal.price || !Number.isFinite(parseFloat(String(signal.price)))) {
    blockers.push("Missing price/candle data");
  }

  const candle = is2MCandleAligned(signal);
  if (candle.missing) blockers.push("2M: Candle data unavailable");
  if (cfg.blockIfDoji && candle.isDoji) blockers.push("Doji candle");
  if (cfg.blockIfCandleConflict && !candle.aligned && !candle.missing) {
    blockers.push("Candle not aligned with direction");
  }

  const readiness = get2MReadiness(signal);
  if (readiness < cfg.watchReadiness) {
    blockers.push("Very low readiness below 60");
  }

  if (cfg.blockIfTrendExhausted && signal.signalType === "TREND EXHAUSTED") {
    blockers.push("Trend exhausted");
  }
  if (cfg.blockIfRepeatedSignal && signal.signalType === "REPEATED SIGNAL") {
    blockers.push("Repeated signal");
  }
  if (signal.signalType === "DAILY LIMIT") blockers.push("Daily limit block");
  if (cfg.blockIfNews && signal.signalType === "NEWS CAUTION") blockers.push("News block");

  const textPool = [
    ...(signal.blockers || []),
    signal.v9Blocker || "",
    signal.signalReason || "",
    signal.riskNote || "",
  ]
    .join(" · ")
    .toLowerCase();

  for (const word of HARD_BLOCKER_WORDS) {
    if (textPool.includes(word)) {
      const label =
        word === "conflict"
          ? "EMA/WMA or candle conflict"
          : word === "oversized candle"
            ? "Oversized candle"
            : word.charAt(0).toUpperCase() + word.slice(1);
      if (!blockers.some((b) => b.toLowerCase().includes(word))) {
        blockers.push(label);
      }
    }
  }

  // Reversal pattern against direction
  const against = (signal.pats || []).some(
    (p) =>
      (signal.direction === "CALL" && p.d === "bear" && p.s >= 2) ||
      (signal.direction === "PUT" && p.d === "bull" && p.s >= 2),
  );
  if (against) blockers.push("Strong reversal pattern against direction");

  return [...new Set(blockers)];
}

export function getOneMinuteMicroConfirmation(
  pair: string,
  direction: "CALL" | "PUT",
  oneMinOhlc: OHLC[] | null | undefined,
): { status: OneMinuteConfirmation; note: string } {
  void pair;
  if (!oneMinOhlc || oneMinOhlc.length < 2) {
    return { status: "UNAVAILABLE", note: "1m confirmation unavailable" };
  }

  const last = oneMinOhlc[oneMinOhlc.length - 1];
  const prev = oneMinOhlc[oneMinOhlc.length - 2];
  const range = Math.max(last.high - last.low, 1e-10);
  const bodyRatio = (Math.abs(last.close - last.open) / range) * 100;
  const doji = bodyRatio < MICRO_2M_CONFIG.minBodyRatio;

  if (doji) {
    return { status: "NEUTRAL", note: "1m candle is doji — neutral" };
  }

  if (direction === "CALL") {
    const supports = last.close >= last.open && last.close >= prev.close;
    if (supports) return { status: "SUPPORTS", note: "1m momentum supports direction" };
    if (last.close < last.open && last.close < prev.close) {
      return { status: "CONFLICTS", note: "1m momentum conflicts with CALL" };
    }
    return { status: "NEUTRAL", note: "1m momentum mixed" };
  }

  const supports = last.close <= last.open && last.close <= prev.close;
  if (supports) return { status: "SUPPORTS", note: "1m momentum supports direction" };
  if (last.close > last.open && last.close > prev.close) {
    return { status: "CONFLICTS", note: "1m momentum conflicts with PUT" };
  }
  return { status: "NEUTRAL", note: "1m momentum mixed" };
}

function permissionLabel(p: Micro2MPermission): Micro2MLabel {
  if (p === "2M_STRONG_MICRO") return "STRONG 2M MICRO TRADE";
  if (p === "2M_MICRO_TRADE") return "2M MICRO TRADE";
  if (p === "2M_WATCH") return "2M WATCH";
  return "2M AVOID";
}

export function get2MMicroReason(
  permission: Micro2MPermission,
  readiness: number,
  oneMin: OneMinuteConfirmation,
): string {
  if (permission === "2M_STRONG_MICRO") {
    return oneMin === "SUPPORTS"
      ? "Readiness is strong, direction is clear, candle supports direction, and short-term momentum confirms."
      : "Readiness is strong, direction is clear, and candle supports direction for a short-term 2-minute candidate.";
  }
  if (permission === "2M_MICRO_TRADE") {
    return `Direction is clear and readiness is ${readiness}% (above 70%). Use only for 2-minute expiry with fixed small amount.`;
  }
  if (permission === "2M_WATCH") {
    return "Setup is forming but readiness is below 70%. Wait for stronger candle alignment.";
  }
  return "Do not trade. Direction or candle condition is not safe.";
}

export function get2MMicroAction(permission: Micro2MPermission): string {
  if (permission === "2M_STRONG_MICRO") {
    return "2-minute expiry only. Use fixed small amount. Stop after 2 losses.";
  }
  if (permission === "2M_MICRO_TRADE") {
    return "2-minute expiry only. Take only if platform price and candle direction remain valid.";
  }
  if (permission === "2M_WATCH") {
    return "Watch only. Do not place real trade yet.";
  }
  return "Avoid this trade.";
}

function downgrade(permission: Micro2MPermission): Micro2MPermission {
  if (permission === "2M_STRONG_MICRO") return "2M_MICRO_TRADE";
  if (permission === "2M_MICRO_TRADE") return "2M_WATCH";
  if (permission === "2M_WATCH") return "2M_AVOID";
  return "2M_AVOID";
}

function gradeAllowedForMicro(grade: string): boolean {
  return grade === "B" || grade === "A" || grade === "A+";
}

/** Classify a V9 signal into 2M Micro permission — does not alter V9 LIVE fields. */
export function classify2MMicroSignal(
  signal: ComputedSignal,
  oneMinData: OHLC[] | null = null,
) {
  const cfg = MICRO_2M_CONFIG;
  const readiness = get2MReadiness(signal);
  const candle = is2MCandleAligned(signal);
  const hard = get2MHardBlockers(signal);
  const warnings: string[] = [];

  if (cfg.cautionPairs.includes(signal.pair) && readiness < cfg.strongTradeReadiness) {
    warnings.push("EUR/GBP caution — prefer stronger readiness");
  }

  const oneMin = cfg.useOneMinuteConfirmation
    ? getOneMinuteMicroConfirmation(signal.pair, signal.direction, oneMinData)
    : { status: "UNAVAILABLE" as const, note: "1m confirmation unavailable" };

  if (oneMin.status === "UNAVAILABLE") warnings.push(oneMin.note);
  if (oneMin.status === "SUPPORTS") warnings.push(oneMin.note);

  let permission: Micro2MPermission = "2M_AVOID";

  const cleanDirection = signal.direction === "CALL" || signal.direction === "PUT";
  const hasHard = hard.length > 0;
  const gradeOk = gradeAllowedForMicro(signal.grade || "C");

  if (!cleanDirection || hasHard) {
    permission = "2M_AVOID";
  } else if (
    gradeOk &&
    readiness >= cfg.strongTradeReadiness &&
    candle.aligned &&
    candle.bodyRatio >= cfg.strongBodyRatio &&
    (oneMin.status === "SUPPORTS" || oneMin.status === "UNAVAILABLE")
  ) {
    permission = "2M_STRONG_MICRO";
  } else if (
    gradeOk &&
    readiness >= cfg.minTradeReadiness &&
    candle.aligned &&
    candle.bodyRatio >= cfg.minBodyRatio
  ) {
    permission = "2M_MICRO_TRADE";
  } else if (
    readiness >= cfg.watchReadiness &&
    readiness < cfg.minTradeReadiness &&
    cleanDirection &&
    !candle.isDoji
  ) {
    permission = "2M_WATCH";
  } else {
    permission = "2M_AVOID";
  }

  // Strong requires 1m support when available and conflicting
  if (
    permission === "2M_STRONG_MICRO" &&
    cfg.useOneMinuteConfirmation &&
    oneMin.status === "CONFLICTS"
  ) {
    permission = downgrade(permission);
  } else if (permission !== "2M_AVOID" && oneMin.status === "CONFLICTS") {
    permission = downgrade(permission);
  }

  // V9 REJECTED with hard live-unsuitable reasons already covered by hard blockers.
  // Correlation / live-selector rejects can still qualify if clean.
  if (
    signal.v9Layer === "REJECTED" &&
    hasHard &&
    hard.some((b) =>
      /candle|doji|news|weekend|direction|trend exhausted|repeated|conflict/i.test(b),
    )
  ) {
    permission = "2M_AVOID";
  }

  const microLabel = permissionLabel(permission);
  return {
    microReadiness: readiness,
    microPermission: permission,
    microLabel,
    microReason: get2MMicroReason(permission, readiness, oneMin.status),
    microAction: get2MMicroAction(permission),
    candleAligned: candle.aligned,
    candleBodyRatio: candle.bodyRatio,
    isDoji: candle.isDoji,
    oneMinuteStatus: oneMin.status,
    oneMinuteNote: oneMin.note,
    warnings,
    hardBlockers: hard,
  };
}
