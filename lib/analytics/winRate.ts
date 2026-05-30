export function isRealTradeSignal(signalType?: string | null, grade?: string | null) {
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

export function calculateRealWinRate(
  rows: { signal_type?: string | null; grade?: string | null; result?: string | null }[]
) {
  const eligible = rows.filter(
    (r) =>
      isRealTradeSignal(r.signal_type, r.grade) &&
      (r.result === "Win" || r.result === "Loss")
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
