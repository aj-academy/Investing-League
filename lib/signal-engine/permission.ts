import type { ComputedSignal, SignalType } from "./types";

export type TradePermission = "TRADE ALLOWED" | "OBSERVE ONLY" | "DO NOT TRADE";

const DO_NOT_TRADE_TYPES: SignalType[] = [
  "LATE ENTRY",
  "REPEATED SIGNAL",
  "TREND EXHAUSTED",
];

const OBSERVE_TYPES: SignalType[] = ["DAILY LIMIT", "NEWS CAUTION", "WATCH ONLY"];

export function resolvePermission(sig: ComputedSignal): TradePermission {
  if (sig.permission) return sig.permission;
  if (DO_NOT_TRADE_TYPES.includes(sig.signalType)) return "DO NOT TRADE";
  if (
    sig.tradeEligible &&
    (sig.signalType === "FINAL TRADE" || sig.signalType === "STRONG FINAL")
  ) {
    return "TRADE ALLOWED";
  }
  if (sig.signalType === "CORRELATION RISK" || sig.signalType === "LIVE SELECTOR WATCH") {
    return "DO NOT TRADE";
  }
  return "OBSERVE ONLY";
}

export function applyPermission(sig: ComputedSignal): ComputedSignal {
  sig.permission = resolvePermission(sig);
  return sig;
}

/** Takeable 2M Micro journal labels (auto-saved on scan). */
const TAKEABLE_2M_SIGNAL_TYPES = new Set([
  "2M MICRO TRADE",
  "STRONG 2M MICRO TRADE",
  "2M TRADE ALLOWED",
  "STRONG 2M TRADE ALLOWED",
]);

export function journalPermission(
  signalType?: string | null,
  tradeEligible?: boolean | null
): TradePermission {
  const raw = (signalType || "WATCH ONLY").trim();
  // 2M takeable rows use non-V9 labels and trade_eligible=false — still show under "Trade allowed"
  if (TAKEABLE_2M_SIGNAL_TYPES.has(raw)) return "TRADE ALLOWED";
  if (raw === "2M AVOID") return "DO NOT TRADE";
  if (raw === "2M WATCH") return "OBSERVE ONLY";

  const t = raw as SignalType;
  if (DO_NOT_TRADE_TYPES.includes(t) || t === "CORRELATION RISK") return "DO NOT TRADE";
  if (OBSERVE_TYPES.includes(t)) return "OBSERVE ONLY";
  if (tradeEligible && (t === "FINAL TRADE" || t === "STRONG FINAL")) return "TRADE ALLOWED";
  return "OBSERVE ONLY";
}

export type MinGradeFilter = "B" | "A" | "A+";

export function gradeAllowed(grade: string, min: MinGradeFilter): boolean {
  if (min === "B") return ["A+", "A", "B"].includes(grade);
  if (min === "A") return ["A+", "A"].includes(grade);
  return grade === "A+";
}
