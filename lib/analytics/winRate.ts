export function isRealTradeSignal(
  signalType?: string | null,
  grade?: string | null,
  v9Layer?: string | null,
  v10Layer?: string | null,
) {
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
  ];
  if (signalType && excluded.includes(signalType)) return false;
  return signalType === "STRONG FINAL" || signalType === "FINAL TRADE";
}

export function isPendingOrderTradeSignal(
  signalType?: string | null,
  grade?: string | null,
  v10Layer?: string | null,
) {
  if (v10Layer !== "PENDING_ORDER_ELIGIBLE") return false;
  if (grade === "B") return false;
  return signalType === "STRONG FINAL" || signalType === "FINAL TRADE";
}

export function calculateRealWinRate(
  rows: {
    signal_type?: string | null;
    grade?: string | null;
    result?: string | null;
    v9_layer?: string | null;
    v10_layer?: string | null;
    entry_method?: string | null;
  }[],
) {
  const eligible = rows.filter(
    (r) =>
      isRealTradeSignal(r.signal_type, r.grade, r.v9_layer, r.v10_layer) &&
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
    entry_method?: string | null;
  }[],
) {
  const eligible = rows.filter(
    (r) =>
      isPendingOrderTradeSignal(r.signal_type, r.grade, r.v10_layer) &&
      (r.entry_method === "pending_order" || r.v10_layer === "PENDING_ORDER_ELIGIBLE") &&
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
    entry_method?: string | null;
  }[],
) {
  const eligible = rows.filter(
    (r) =>
      isRealTradeSignal(r.signal_type, r.grade, null, r.v10_layer) &&
      (r.entry_method === "manual" || (!r.entry_method && r.v10_layer === "LIVE")) &&
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
