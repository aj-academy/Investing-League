import { bestByKey } from "./pairStats";
import { calculateRealWinRate, isRealTradeSignal } from "./winRate";

export interface JournalRow {
  id: string;
  pair: string;
  timeframe: string;
  direction: string;
  grade: string | null;
  signal_type: string | null;
  result: string | null;
  entry_status: string | null;
  loss_reason: string | null;
  confidence: number | null;
  entry_drift: number | null;
  trade_eligible?: boolean | null;
  created_at: string;
}

export function buildAnalyticsSummary(rows: JournalRow[]) {
  const totalSignals = rows.length;
  const tradeEligible = rows.filter((r) => r.signal_type && isRealTradeSignal(r.signal_type, r.grade));
  const completed = rows.filter((r) => ["Win", "Loss", "Refund"].includes(r.result || ""));
  const wins = rows.filter((r) => r.result === "Win").length;
  const losses = rows.filter((r) => r.result === "Loss").length;
  const refunds = rows.filter((r) => r.result === "Refund").length;
  const pending = rows.filter((r) => r.result === "Pending" || !r.result).length;
  const realWr = calculateRealWinRate(rows);
  const observation = rows.filter((r) => r.result === "Win" || r.result === "Loss");
  const obsWins = observation.filter((r) => r.result === "Win").length;
  const observationAccuracy = observation.length
    ? Math.round((obsWins / observation.length) * 100)
    : 0;
  const invalidEntries = rows.filter((r) => r.entry_status === "Invalid Entry").length;

  const lossReasons: Record<string, number> = {};
  rows
    .filter((r) => r.result === "Loss" && r.loss_reason)
    .forEach((r) => {
      const k = r.loss_reason || "Unknown";
      lossReasons[k] = (lossReasons[k] || 0) + 1;
    });

  const driftBuckets = { valid: 0, risky: 0, invalid: 0, pending: 0 };
  rows.forEach((r) => {
    if (r.entry_status === "Valid Entry") driftBuckets.valid++;
    else if (r.entry_status === "Risky Entry") driftBuckets.risky++;
    else if (r.entry_status === "Invalid Entry") driftBuckets.invalid++;
    else driftBuckets.pending++;
  });

  return {
    totalSignals,
    tradeEligible: tradeEligible.length,
    completedTrades: completed.length,
    mostFrequentSignalType: mostFrequentByKey(rows, "signal_type"),
    wins,
    losses,
    refunds,
    pending,
    finalTradeWinRate: realWr.rate,
    realTradeWins: realWr.wins,
    realTradeLosses: realWr.losses,
    realTradeTotal: realWr.total,
    observationAccuracy,
    invalidEntries,
    bestPair: bestByKey(rows, "pair"),
    worstPair: bestByKey(
      rows.filter((r) => r.result === "Loss"),
      "pair"
    ),
    bestTimeframe: bestByKey(rows, "timeframe"),
    bestGrade: bestByKey(rows, "grade"),
    bestSignalType: bestByKey(rows, "signal_type"),
    lossReasons,
    entryDrift: driftBuckets,
    pairPerformance: aggregateBy(rows, "pair"),
    timeframePerformance: aggregateBy(rows, "timeframe"),
    signalTypePerformance: aggregateBy(rows, "signal_type"),
  };
}

function mostFrequentByKey(rows: JournalRow[], key: keyof JournalRow) {
  const counts: Record<string, number> = {};
  rows.forEach((r) => {
    const k = String(r[key] ?? "—");
    counts[k] = (counts[k] || 0) + 1;
  });
  let best = "—";
  let max = 0;
  for (const [k, n] of Object.entries(counts)) {
    if (n > max) {
      max = n;
      best = k;
    }
  }
  return max > 0 ? best : "—";
}

function aggregateBy(rows: JournalRow[], key: keyof JournalRow) {
  const map: Record<string, { wins: number; losses: number; refunds: number; total: number }> = {};
  rows.forEach((r) => {
    const k = String(r[key] ?? "—");
    if (!map[k]) map[k] = { wins: 0, losses: 0, refunds: 0, total: 0 };
    map[k].total++;
    if (r.result === "Win") map[k].wins++;
    else if (r.result === "Loss") map[k].losses++;
    else if (r.result === "Refund") map[k].refunds++;
  });
  return Object.entries(map).map(([name, v]) => ({ name, ...v }));
}
