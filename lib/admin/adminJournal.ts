import { mapSignalTypeFilter } from "@/lib/risk/capitalProtection";

export type AdminJournalFilters = {
  userId?: string;
  userName?: string;
  from?: string;
  to?: string;
  pair?: string;
  result?: string;
  signalType?: string;
  mode?: string;
  timeframe?: string;
  plan?: string;
  verifiedOnly?: boolean;
  pendingOnly?: boolean;
};

export type AdminJournalRow = {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  user_plan: string | null;
  created_at: string;
  marked_time: string | null;
  pair: string;
  timeframe: string;
  scan_mode: string | null;
  signal_type: string | null;
  signal_type_label: string;
  direction: string;
  grade: string | null;
  confidence: number | null;
  trade_amount: number;
  payout_percent: number;
  return_amount: number;
  net_profit: number;
  olymp_opening_quote: number | null;
  olymp_closing_quote: number | null;
  result: string;
  loss_reason: string | null;
  result_source: string | null;
  entry_status: string | null;
  risk_status: string | null;
  consecutive_loss_count: number;
  verified: boolean;
};

export type AdminJournalSummary = {
  usersTraded: number;
  totalTrades: number;
  totalTradeAmount: number;
  totalReturnAmount: number;
  totalNetProfit: number;
  wins: number;
  losses: number;
  refunds: number;
  pending: number;
  bestPair: string | null;
  worstPair: string | null;
  usersWithLossWarning: number;
  usersIgnoringDnt: number;
};

export const ADMIN_JOURNAL_CSV_HEADERS = [
  "User Name",
  "Email",
  "Date & Time",
  "Pair",
  "Timeframe",
  "Mode",
  "Signal Type",
  "Direction",
  "Grade",
  "Confidence",
  "Trade Amount",
  "Payout %",
  "Return Amount",
  "Net Profit",
  "Platform Open Quote",
  "Platform Close Quote",
  "Result",
  "Loss Reason",
  "Verified Status",
] as const;

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function adminJournalRowToCsvLine(row: AdminJournalRow): string {
  const dt = row.marked_time || row.created_at;
  const verified =
    row.verified
      ? "Verified"
      : row.result === "Pending"
        ? "Pending"
        : "Unverified";

  return [
    row.user_name ?? "",
    row.user_email ?? "",
    dt,
    row.pair,
    row.timeframe,
    row.scan_mode ?? "practice",
    row.signal_type_label,
    row.direction,
    row.grade ?? "",
    row.confidence != null ? Math.round(row.confidence) : "",
    row.trade_amount,
    row.payout_percent,
    row.return_amount,
    row.net_profit,
    row.olymp_opening_quote ?? "",
    row.olymp_closing_quote ?? "",
    row.result,
    row.loss_reason ?? "",
    verified,
  ]
    .map(csvEscape)
    .join(",");
}

export function adminJournalToCsv(rows: AdminJournalRow[]): string {
  const header = ADMIN_JOURNAL_CSV_HEADERS.join(",");
  const lines = rows.map(adminJournalRowToCsvLine);
  return [header, ...lines].join("\n");
}

export function normalizeAdminJournalRow(
  row: Record<string, unknown>,
  profile: { full_name?: string | null; email?: string | null; plan?: string | null } | null,
): AdminJournalRow {
  const signalType = (row.signal_type as string | null) ?? null;
  const tradeEligible = row.trade_eligible as boolean | null;
  const resultSource = (row.result_source as string | null) ?? null;
  const entryStatus = (row.entry_status as string | null) ?? null;
  const result = String(row.result || "Pending");

  return {
    id: String(row.id),
    user_id: String(row.user_id),
    user_name: profile?.full_name ?? null,
    user_email: profile?.email ?? null,
    user_plan: profile?.plan ?? null,
    created_at: String(row.created_at),
    marked_time: (row.marked_time as string | null) ?? null,
    pair: String(row.pair),
    timeframe: String(row.timeframe),
    scan_mode: (row.scan_mode as string | null) ?? "practice",
    signal_type: signalType,
    signal_type_label: mapSignalTypeFilter(signalType, tradeEligible),
    direction: String(row.direction),
    grade: (row.grade as string | null) ?? null,
    confidence: row.confidence != null ? Number(row.confidence) : null,
    trade_amount: Number(row.trade_amount) || 0,
    payout_percent: Number(row.payout_percent) || 0,
    return_amount: Number(row.return_amount) || 0,
    net_profit: Number(row.net_profit) || 0,
    olymp_opening_quote:
      row.olymp_opening_quote != null ? Number(row.olymp_opening_quote) : null,
    olymp_closing_quote:
      row.olymp_closing_quote != null ? Number(row.olymp_closing_quote) : null,
    result,
    loss_reason: (row.loss_reason as string | null) ?? null,
    result_source: resultSource,
    entry_status: entryStatus,
    risk_status: (row.risk_status as string | null) ?? "normal",
    consecutive_loss_count: Number(row.consecutive_loss_count) || 0,
    verified:
      resultSource === "Auto" ||
      resultSource === "Manual" ||
      (entryStatus != null && entryStatus !== "Pending"),
  };
}

export function computeAdminJournalSummary(rows: AdminJournalRow[]): AdminJournalSummary {
  const userIds = new Set<string>();
  let totalTradeAmount = 0;
  let totalReturnAmount = 0;
  let totalNetProfit = 0;
  let wins = 0;
  let losses = 0;
  let refunds = 0;
  let pending = 0;

  const pairProfit: Record<string, number> = {};
  const userLossWarnings = new Set<string>();
  const usersIgnoringDnt = new Set<string>();

  for (const r of rows) {
    if (r.result !== "Pending") userIds.add(r.user_id);
    totalTradeAmount += r.trade_amount;
    totalReturnAmount += r.return_amount;
    totalNetProfit += r.net_profit;

    if (r.result === "Win") wins++;
    else if (r.result === "Loss") losses++;
    else if (r.result === "Refund") refunds++;
    else pending++;

    if (r.result === "Win" || r.result === "Loss" || r.result === "Refund") {
      pairProfit[r.pair] = (pairProfit[r.pair] ?? 0) + r.net_profit;
    }

    if (r.consecutive_loss_count >= 3) userLossWarnings.add(r.user_id);
    if (
      r.signal_type_label === "Do Not Trade" &&
      (r.result === "Win" || r.result === "Loss")
    ) {
      usersIgnoringDnt.add(r.user_id);
    }
  }

  let bestPair: string | null = null;
  let worstPair: string | null = null;
  let bestVal = -Infinity;
  let worstVal = Infinity;
  for (const [pair, profit] of Object.entries(pairProfit)) {
    if (profit > bestVal) {
      bestVal = profit;
      bestPair = pair;
    }
    if (profit < worstVal) {
      worstVal = profit;
      worstPair = pair;
    }
  }

  return {
    usersTraded: userIds.size,
    totalTrades: rows.filter((r) => r.result !== "Pending").length,
    totalTradeAmount,
    totalReturnAmount,
    totalNetProfit,
    wins,
    losses,
    refunds,
    pending,
    bestPair,
    worstPair,
    usersWithLossWarning: userLossWarnings.size,
    usersIgnoringDnt: usersIgnoringDnt.size,
  };
}

export type AdminUserJournalSummary = {
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  total_trades: number;
  wins: number;
  losses: number;
  refunds: number;
  pending: number;
  total_trade_amount: number;
  total_return_amount: number;
  net_pl: number;
  win_rate: number;
  best_pair: string | null;
  worst_pair: string | null;
  risk_status: string;
  consecutive_losses: number;
  starting_capital?: number;
  current_capital?: number;
  risk_per_trade_percent?: number;
};

export function computeUserSummaries(rows: AdminJournalRow[]): AdminUserJournalSummary[] {
  const byUser = new Map<string, AdminJournalRow[]>();
  for (const r of rows) {
    const list = byUser.get(r.user_id) ?? [];
    list.push(r);
    byUser.set(r.user_id, list);
  }

  return Array.from(byUser.entries()).map(([userId, userRows]) => {
    let wins = 0;
    let losses = 0;
    let refunds = 0;
    let pending = 0;
    let totalTradeAmount = 0;
    let totalReturnAmount = 0;
    let netPl = 0;
    const pairProfit: Record<string, number> = {};
    let maxStreak = 0;
    let latestRisk = "normal";

    for (const r of userRows) {
      totalTradeAmount += r.trade_amount;
      totalReturnAmount += r.return_amount;
      netPl += r.net_profit;
      if (r.result === "Win") wins++;
      else if (r.result === "Loss") losses++;
      else if (r.result === "Refund") refunds++;
      else pending++;

      if (r.result === "Win" || r.result === "Loss" || r.result === "Refund") {
        pairProfit[r.pair] = (pairProfit[r.pair] ?? 0) + r.net_profit;
      }
      if (r.consecutive_loss_count > maxStreak) maxStreak = r.consecutive_loss_count;
      if (r.risk_status) latestRisk = r.risk_status;
    }

    let bestPair: string | null = null;
    let worstPair: string | null = null;
    let bestVal = -Infinity;
    let worstVal = Infinity;
    for (const [pair, profit] of Object.entries(pairProfit)) {
      if (profit > bestVal) {
        bestVal = profit;
        bestPair = pair;
      }
      if (profit < worstVal) {
        worstVal = profit;
        worstPair = pair;
      }
    }

    const settled = wins + losses;
    const winRate = settled > 0 ? Math.round((wins / settled) * 100) : 0;
    const sample = userRows[0];

    return {
      user_id: userId,
      user_name: sample.user_name,
      user_email: sample.user_email,
      total_trades: wins + losses + refunds + pending,
      wins,
      losses,
      refunds,
      pending,
      total_trade_amount: totalTradeAmount,
      total_return_amount: totalReturnAmount,
      net_pl: netPl,
      win_rate: winRate,
      best_pair: bestPair,
      worst_pair: worstPair,
      risk_status: latestRisk,
      consecutive_losses: maxStreak,
    };
  });
}
