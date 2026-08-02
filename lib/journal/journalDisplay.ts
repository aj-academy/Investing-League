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

export function isEligibleType(
  signalType?: string | null,
  grade?: string | null,
  v9Layer?: string | null,
  v10Layer?: string | null,
  entryMethod?: string | null,
  strategyType?: string | null,
) {
  if (strategyType === "2M_MICRO" || entryMethod === "manual_2m") return false;
  if (v10Layer && v10Layer !== "LIVE") return false;
  if (!v10Layer && v9Layer && v9Layer !== "LIVE") return false;
  return isRealTradeSignal(signalType, grade, v9Layer, v10Layer, null, entryMethod, strategyType);
}

export function isCountedInWr(
  signalType?: string | null,
  grade?: string | null,
  result?: string | null,
  v9Layer?: string | null,
  v10Layer?: string | null,
) {
  return (
    isEligibleType(signalType, grade, v9Layer, v10Layer) &&
    (result === "Win" || result === "Loss" || result === "Refund")
  );
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
    entry_method?: string | null;
    strategy_type?: string | null;
    v9_layer?: string | null;
    v10_layer?: string | null;
  }[]
): JournalStatsSummary {
  const eligible = rows.filter((r) =>
    isEligibleType(r.signal_type, r.grade, r.v9_layer, r.v10_layer, r.entry_method, r.strategy_type),
  );
  const eligibleDone = eligible.filter((r) => r.result === "Win" || r.result === "Loss");
  const wins = eligibleDone.filter((r) => r.result === "Win").length;
  const losses = eligibleDone.filter((r) => r.result === "Loss").length;
  const obs = rows.filter(
    (r) =>
      !isEligibleType(r.signal_type, r.grade, r.v9_layer, r.v10_layer, r.entry_method, r.strategy_type),
  ).length;
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

export type Micro2MJournalStats = {
  total: number;
  wins: number;
  losses: number;
  refunds: number;
  winRate: string;
  bestPair: string;
  worstPair: string;
  bestDirection: string;
  wr70_74: string;
  wr75_79: string;
  wr80plus: string;
};

function isMicro2MRow(r: {
  entry_method?: string | null;
  strategy_type?: string | null;
  signal_type?: string | null;
}) {
  const t = r.signal_type || "";
  return (
    r.strategy_type === "2M_MICRO" ||
    r.entry_method === "manual_2m" ||
    t.includes("2M MICRO") ||
    t.includes("STRONG 2M") ||
    t.includes("2M TRADE") ||
    t === "2M WATCH" ||
    t === "2M AVOID"
  );
}

function bucketWr(
  rows: { result?: string | null; micro_readiness?: number | null; v9_readiness?: number | null; confidence?: number | null }[],
  min: number,
  maxExclusive: number | null,
) {
  const done = rows.filter((r) => {
    const ready = Number(r.micro_readiness ?? r.v9_readiness ?? r.confidence ?? 0);
    if (ready < min) return false;
    if (maxExclusive != null && ready >= maxExclusive) return false;
    return r.result === "Win" || r.result === "Loss";
  });
  if (!done.length) return "—";
  const wins = done.filter((r) => r.result === "Win").length;
  return `${((wins / done.length) * 100).toFixed(1)}%`;
}

export function computeMicro2MJournalStats(
  rows: {
    result?: string | null;
    pair?: string;
    direction?: string;
    entry_method?: string | null;
    strategy_type?: string | null;
    signal_type?: string | null;
    micro_readiness?: number | null;
    v9_readiness?: number | null;
    confidence?: number | null;
  }[],
): Micro2MJournalStats {
  const micro = rows.filter(isMicro2MRow);
  const wins = micro.filter((r) => r.result === "Win").length;
  const losses = micro.filter((r) => r.result === "Loss").length;
  const refunds = micro.filter((r) => r.result === "Refund").length;
  const done = wins + losses;
  const winRate = done ? `${((wins / done) * 100).toFixed(1)}%` : "—";

  const pairWr = (pair: string) => {
    const p = micro.filter((r) => r.pair === pair && (r.result === "Win" || r.result === "Loss"));
    if (!p.length) return -1;
    return p.filter((r) => r.result === "Win").length / p.length;
  };
  const pairs = [...new Set(micro.map((r) => r.pair).filter(Boolean))] as string[];
  let bestPair = "—";
  let worstPair = "—";
  let best = -1;
  let worst = 2;
  for (const p of pairs) {
    const wr = pairWr(p);
    if (wr < 0) continue;
    if (wr > best) {
      best = wr;
      bestPair = p;
    }
    if (wr < worst) {
      worst = wr;
      worstPair = p;
    }
  }

  const dirWr = (d: string) => {
    const p = micro.filter((r) => r.direction === d && (r.result === "Win" || r.result === "Loss"));
    if (!p.length) return -1;
    return p.filter((r) => r.result === "Win").length / p.length;
  };
  const call = dirWr("CALL");
  const put = dirWr("PUT");
  let bestDirection = "—";
  if (call >= 0 || put >= 0) {
    bestDirection = call >= put ? "CALL" : "PUT";
  }

  return {
    total: micro.length,
    wins,
    losses,
    refunds,
    winRate,
    bestPair,
    worstPair,
    bestDirection,
    wr70_74: bucketWr(micro, 70, 75),
    wr75_79: bucketWr(micro, 75, 80),
    wr80plus: bucketWr(micro, 80, null),
  };
}
