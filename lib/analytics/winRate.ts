export function isRealTradeSignal(
  signalType?: string | null,
  grade?: string | null,
  v9Layer?: string | null,
  v10Layer?: string | null,
  v10Permission?: string | null,
  entryMethod?: string | null,
  strategyType?: string | null,
) {
  // 2M Micro trades are never counted in V9 LIVE win rate
  if (strategyType === "2M_MICRO" || entryMethod === "manual_2m") return false;
  if (v10Permission) {
    return v10Permission === "TRADE_ALLOWED";
  }
  if (v10Layer) {
    if (v10Layer !== "LIVE") return false;
  } else if (v9Layer && v9Layer !== "LIVE") {
    return false;
  }
  if (grade === "B") return false;
  const excluded = [
    "WATCH ONLY",
    "REPEATED SIGNAL",
    "TREND EXHAUSTED",
    "LATE ENTRY",
    "CORRELATION RISK",
    "LIVE SELECTOR WATCH",
    "V10 CAUTION SIGNAL",
    "V10 AVOID TRADE",
    "2M MICRO TRADE",
    "STRONG 2M MICRO TRADE",
    "2M WATCH",
    "2M AVOID",
  ];
  if (signalType && excluded.includes(signalType)) return false;
  return (
    signalType === "STRONG FINAL" ||
    signalType === "FINAL TRADE" ||
    signalType === "V10 TRADE ALLOWED"
  );
}

export function isPendingOrderTradeSignal(
  signalType?: string | null,
  grade?: string | null,
  v10Layer?: string | null,
  v10Permission?: string | null,
) {
  if (v10Permission) {
    return v10Permission === "PENDING_ORDER_SIGNAL";
  }
  if (v10Layer !== "PENDING_ORDER_ELIGIBLE") return false;
  if (grade === "B") return false;
  return (
    signalType === "STRONG FINAL" ||
    signalType === "FINAL TRADE" ||
    signalType === "V10 PENDING SIGNAL"
  );
}

export function isCautionOrAvoid(v10Permission?: string | null): boolean {
  return v10Permission === "CAUTION_SIGNAL" || v10Permission === "AVOID_TRADE";
}

export function calculateRealWinRate(
  rows: {
    signal_type?: string | null;
    grade?: string | null;
    result?: string | null;
    v9_layer?: string | null;
    v10_layer?: string | null;
    v10_permission?: string | null;
    entry_method?: string | null;
    strategy_type?: string | null;
  }[],
) {
  const eligible = rows.filter(
    (r) =>
      isRealTradeSignal(
        r.signal_type,
        r.grade,
        r.v9_layer,
        r.v10_layer,
        r.v10_permission,
        r.entry_method,
        r.strategy_type,
      ) &&
      !isCautionOrAvoid(r.v10_permission) &&
      (r.result === "Win" || r.result === "Loss" || r.result === "Refund"),
  );
  const wins = eligible.filter((r) => r.result === "Win").length;
  const total = eligible.length;
  return {
    wins,
    losses: total - wins,
    total,
    rate: total ? Math.round((wins / total) * 100) : 0,
  };
}

export function calculatePendingOrderWinRate(
  rows: {
    signal_type?: string | null;
    grade?: string | null;
    result?: string | null;
    v10_layer?: string | null;
    v10_permission?: string | null;
    entry_method?: string | null;
  }[],
) {
  const eligible = rows.filter(
    (r) =>
      isPendingOrderTradeSignal(
        r.signal_type,
        r.grade,
        r.v10_layer,
        r.v10_permission,
      ) &&
      (r.entry_method === "pending_order" ||
        r.v10_permission === "PENDING_ORDER_SIGNAL" ||
        r.v10_layer === "PENDING_ORDER_ELIGIBLE") &&
      (r.result === "Win" || r.result === "Loss" || r.result === "Refund"),
  );
  const wins = eligible.filter((r) => r.result === "Win").length;
  const total = eligible.length;
  return {
    wins,
    losses: total - wins,
    total,
    rate: total ? Math.round((wins / total) * 100) : 0,
  };
}

export function calculateManualEntryWinRate(
  rows: {
    signal_type?: string | null;
    grade?: string | null;
    result?: string | null;
    v10_layer?: string | null;
    v10_permission?: string | null;
    entry_method?: string | null;
  }[],
) {
  const eligible = rows.filter(
    (r) =>
      isRealTradeSignal(r.signal_type, r.grade, null, r.v10_layer, r.v10_permission) &&
      (r.entry_method === "manual" ||
        (!r.entry_method && r.v10_permission === "TRADE_ALLOWED") ||
        r.v10_layer === "LIVE") &&
      (r.result === "Win" || r.result === "Loss" || r.result === "Refund"),
  );
  const wins = eligible.filter((r) => r.result === "Win").length;
  const total = eligible.length;
  return {
    wins,
    losses: total - wins,
    total,
    rate: total ? Math.round((wins / total) * 100) : 0,
  };
}

export function averagePendingDrift(
  rows: { pending_drift?: number | null; entry_method?: string | null }[],
): number | null {
  const vals = rows
    .filter((r) => r.entry_method === "pending_order" && r.pending_drift != null)
    .map((r) => Number(r.pending_drift));
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10000) / 10000;
}
