import { isRealTradeSignal } from "@/lib/analytics/winRate";
import { formatAppDate, formatAppTime } from "@/lib/datetime";
import { calculateEntryDrift, type EntryStatus } from "@/lib/journal/entryDrift";
import { journalPermission } from "@/lib/signal-engine/permission";

export function permissionClass(perm: string) {
  if (perm === "TRADE ALLOWED") return "allowed";
  if (perm === "DO NOT TRADE") return "blocked";
  return "observe";
}

export function rowPermission(
  signalType?: string | null,
  tradeEligible?: boolean | null
) {
  return journalPermission(signalType, tradeEligible);
}

export function isEligibleType(signalType?: string | null, grade?: string | null) {
  return isRealTradeSignal(signalType, grade);
}

export function isCountedInWr(
  signalType?: string | null,
  grade?: string | null,
  result?: string | null
) {
  return isEligibleType(signalType, grade) && (result === "Win" || result === "Loss");
}

export function signalTypeClass(type: string) {
  const t = type || "WATCH ONLY";
  if (t === "STRONG FINAL") return "strong-final";
  if (t === "FINAL TRADE") return "final-trade";
  if (t === "CORRELATION RISK") return "correlation-risk";
  if (t === "LATE ENTRY") return "late-entry";
  if (t === "REPEATED SIGNAL") return "repeated";
  if (t === "TREND EXHAUSTED") return "exhausted";
  if (t === "DAILY LIMIT") return "late-entry";
  if (t === "NEWS CAUTION") return "watch-only";
  return "watch-only";
}

export function driftDisplay(
  pair: string,
  signalPrice: number | null,
  openQuote: number | null,
  entryStatus: string | null,
  entryDrift: number | null
) {
  if (entryStatus && entryStatus !== "Pending") {
    const cls =
      entryStatus === "Valid Entry"
        ? "valid"
        : entryStatus === "Risky Entry"
          ? "risky"
          : "invalid";
    const pips = entryDrift != null ? `${entryDrift} pips` : "";
    return { status: entryStatus, pips, cls };
  }
  const calc = calculateEntryDrift(pair, signalPrice, openQuote);
  const cls =
    calc.status === "Valid Entry"
      ? "valid"
      : calc.status === "Risky Entry"
        ? "risky"
        : calc.status === "Invalid Entry"
          ? "invalid"
          : "pending";
  return {
    status: calc.status,
    pips: calc.drift != null ? `${calc.drift} pips` : "",
    cls,
  };
}

export function formatJournalDate(iso: string) {
  return formatAppDate(iso);
}

export function formatJournalTime(iso: string) {
  return formatAppTime(iso);
}

export function lossReasonText(
  row: {
    signal_type?: string | null;
    grade?: string | null;
    confidence?: number | null;
    entry_status?: string | null;
    loss_reason?: string | null;
    signal_reason?: string | null;
    result?: string | null;
  }
) {
  if (row.loss_reason) return row.loss_reason;
  if (row.result !== "Loss") return row.signal_reason || "";
  if (!isEligibleType(row.signal_type, row.grade)) return "Observation signal traded";
  if (row.entry_status === "Invalid Entry") return "Invalid entry drift";
  if (row.signal_type === "REPEATED SIGNAL") return "Repeated entry";
  if (row.signal_type === "TREND EXHAUSTED") return "Trend exhausted";
  if (row.signal_type === "LATE ENTRY") return "Late / extended";
  if (Number(row.confidence || 0) < 68) return "Low confidence";
  if (row.grade === "B") return "B-grade";
  return "Market loss";
}

export function bestByPairOrExpiry(
  rows: {
    pair?: string;
    timeframe?: string;
    signal_type?: string | null;
    grade?: string | null;
    result?: string | null;
  }[],
  key: "pair" | "timeframe"
) {
  const g: Record<string, { w: number; l: number }> = {};
  rows
    .filter((r) => r.result === "Win" || r.result === "Loss")
    .filter((r) => isEligibleType(r.signal_type, r.grade))
    .forEach((r) => {
      const k = (key === "pair" ? r.pair : r.timeframe) || "—";
      g[k] = g[k] || { w: 0, l: 0 };
      if (r.result === "Win") g[k].w++;
      else g[k].l++;
    });
  let best = "—";
  let bestRate = -1;
  let bestTotal = 0;
  for (const [k, v] of Object.entries(g)) {
    const t = v.w + v.l;
    const rate = t ? v.w / t : 0;
    if (t >= 1 && (rate > bestRate || (rate === bestRate && t > bestTotal))) {
      best = k;
      bestRate = rate;
      bestTotal = t;
    }
  }
  return best;
}

export type JournalStatsSummary = {
  total: number;
  tradeEligible: number;
  verifiedTrades: number;
  eligibleWins: number;
  eligibleLosses: number;
  eligibleWr: string;
  strongWr: string;
  observation: number;
  bestPair: string;
  bestExpiry: string;
};

export function computeJournalStats(
  rows: {
    signal_type?: string | null;
    grade?: string | null;
    result?: string | null;
    pair?: string;
    timeframe?: string;
  }[]
): JournalStatsSummary {
  const eligible = rows.filter((r) => isEligibleType(r.signal_type, r.grade));
  const eligibleDone = eligible.filter((r) => r.result === "Win" || r.result === "Loss");
  const wins = eligibleDone.filter((r) => r.result === "Win").length;
  const losses = eligibleDone.filter((r) => r.result === "Loss").length;
  const obs = rows.filter((r) => !isEligibleType(r.signal_type, r.grade)).length;
  const wr = eligibleDone.length
    ? `${((wins / eligibleDone.length) * 100).toFixed(1)}%`
    : "—";
  const strongDone = rows.filter(
    (r) => r.signal_type === "STRONG FINAL" && (r.result === "Win" || r.result === "Loss")
  );
  const strongWr = strongDone.length
    ? `${((strongDone.filter((r) => r.result === "Win").length / strongDone.length) * 100).toFixed(1)}%`
    : "—";

  return {
    total: rows.length,
    tradeEligible: eligible.length,
    verifiedTrades: eligibleDone.length,
    eligibleWins: wins,
    eligibleLosses: losses,
    eligibleWr: wr,
    strongWr,
    observation: obs,
    bestPair: bestByPairOrExpiry(rows, "pair"),
    bestExpiry: bestByPairOrExpiry(rows, "timeframe"),
  };
}
