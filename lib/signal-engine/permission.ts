import type { ComputedSignal, SignalType } from "./types";

export type TradePermission = "TRADE ALLOWED" | "OBSERVE ONLY" | "DO NOT TRADE";

const DO_NOT_TRADE_TYPES: SignalType[] = [
  "LATE ENTRY",
  "REPEATED SIGNAL",
  "TREND EXHAUSTED",
];

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

export function journalPermission(
  signalType?: string | null,
  tradeEligible?: boolean | null
): TradePermission {
  const t = (signalType || "WATCH ONLY") as SignalType;
  if (DO_NOT_TRADE_TYPES.includes(t) || t === "CORRELATION RISK") return "DO NOT TRADE";
  if (tradeEligible && (t === "FINAL TRADE" || t === "STRONG FINAL")) return "TRADE ALLOWED";
  return "OBSERVE ONLY";
}

export type MinGradeFilter = "B" | "A" | "A+";

export function gradeAllowed(grade: string, min: MinGradeFilter): boolean {
  if (min === "B") return ["A+", "A", "B"].includes(grade);
  if (min === "A") return ["A+", "A"].includes(grade);
  return grade === "A+";
}
