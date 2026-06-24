type ReportCsvInput = {
  profile: {
    email?: string | null;
    full_name?: string | null;
    plan?: string | null;
    role?: string | null;
    is_active?: boolean;
    created_at?: string;
  };
  allowedAssets?: string[];
  capitalProtection?: {
    startingCapital?: number;
    currentCapital?: number;
    todayNetProfit?: number;
    consecutiveLosses?: number;
    riskStatus?: string;
    liveModeLocked?: boolean;
    riskPerTradePercent?: number;
    dailyProfitTargetPercent?: number;
    weeklyProfitTargetAmount?: number;
    dailyLossLimitPercent?: number;
    maxConsecutiveLosses?: number;
    recovery?: { message?: string | null };
  } | null;
  dailySummaries?: Array<Record<string, unknown>>;
  usage?: {
    scansToday?: number;
    totalScans?: number;
    providerCalls?: number;
    cacheHits?: number;
    scansInRange?: number;
    providerCallsInRange?: number;
    cacheHitsInRange?: number;
  };
  totals?: Record<string, unknown>;
  recentScans?: Array<Record<string, unknown>>;
  recentJournal?: Array<Record<string, unknown>>;
  journalEntries?: Array<Record<string, unknown>>;
  filter?: { from?: string; to?: string; result?: string };
};

function esc(value: unknown): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function row(values: unknown[]): string {
  return values.map(esc).join(",");
}

export function userReportToCsv(data: ReportCsvInput): string {
  const lines: string[] = [];
  const p = data.profile;

  lines.push("User Report");
  lines.push(row(["Email", p.email, "Name", p.full_name]));
  lines.push(row(["Plan", p.plan, "Role", p.role]));
  lines.push(row(["Active", p.is_active ? "Yes" : "No", "Joined", p.created_at]));
  if (data.filter?.from || data.filter?.to) {
    lines.push(row(["Filter From", data.filter.from, "Filter To", data.filter.to]));
  }
  if (data.filter?.result) {
    lines.push(row(["Journal Result Filter", data.filter.result]));
  }
  lines.push(row(["Allowed Assets", (data.allowedAssets || []).join("; ")]));
  lines.push("");

  const cap = data.capitalProtection;
  if (cap) {
    lines.push("Capital Protection");
    lines.push(
      row([
        "Starting Capital",
        cap.startingCapital,
        "Current Capital",
        cap.currentCapital,
        "Today P/L",
        cap.todayNetProfit,
      ]),
    );
    lines.push(
      row([
        "Vs Starting",
        cap.startingCapital && cap.currentCapital != null
          ? `${(((cap.currentCapital - cap.startingCapital) / cap.startingCapital) * 100).toFixed(2)}%`
          : "",
        "Loss Streak",
        cap.consecutiveLosses,
        "Risk Status",
        cap.riskStatus,
        "Live Locked",
        cap.liveModeLocked ? "Yes" : "No",
      ]),
    );
    lines.push(
      row([
        "Risk Per Trade %",
        cap.riskPerTradePercent,
        "Daily Profit Target %",
        cap.dailyProfitTargetPercent,
        "Target for the Week",
        cap.weeklyProfitTargetAmount,
        "Daily Loss Limit %",
        cap.dailyLossLimitPercent,
        "Max Consecutive Losses",
        cap.maxConsecutiveLosses,
      ]),
    );
    if (cap.recovery?.message) {
      lines.push(row(["Recovery Note", cap.recovery.message]));
    }
    lines.push("");
  }

  if (data.dailySummaries?.length) {
    lines.push("Daily Summaries");
    lines.push(
      row([
        "Date",
        "Starting Capital",
        "Current Capital",
        "Trades",
        "Wins",
        "Losses",
        "Refunds",
        "Net P/L",
        "Loss Streak",
        "Live Locked",
      ]),
    );
    for (const d of data.dailySummaries) {
      lines.push(
        row([
          d.trade_date,
          d.starting_capital,
          d.current_capital,
          d.total_trades,
          d.wins,
          d.losses,
          d.refunds,
          d.net_profit,
          d.consecutive_losses,
          d.live_mode_locked ? "Yes" : "No",
        ]),
      );
    }
    lines.push("");
  }

  lines.push("Usage");
  lines.push(
    row([
      "Scans Today",
      data.usage?.scansToday,
      "Total Scans",
      data.usage?.totalScans,
      "Provider Calls",
      data.usage?.providerCalls,
      "Cache Hits",
      data.usage?.cacheHits,
    ]),
  );
  if (data.usage?.scansInRange != null) {
    lines.push(
      row([
        "Scans In Range",
        data.usage.scansInRange,
        "Provider In Range",
        data.usage.providerCallsInRange,
        "Cache In Range",
        data.usage.cacheHitsInRange,
      ]),
    );
  }
  lines.push("");

  lines.push("Totals");
  for (const [key, value] of Object.entries(data.totals || {})) {
    lines.push(row([key, value]));
  }
  lines.push("");

  lines.push("Recent Scans");
  lines.push(row(["Created", "Mode", "Pairs", "Timeframes", "Signals", "Provider", "Cache"]));
  for (const s of data.recentScans || []) {
    lines.push(
      row([
        s.created_at,
        s.mode,
        Array.isArray(s.pairs) ? (s.pairs as string[]).join("; ") : s.pairs,
        Array.isArray(s.timeframes) ? (s.timeframes as string[]).join("; ") : s.timeframes,
        s.total_signals,
        s.provider_calls,
        s.cache_hits,
      ]),
    );
  }
  lines.push("");

  const journal = data.journalEntries?.length ? data.journalEntries : data.recentJournal || [];
  lines.push("Journal Entries");
  lines.push(
    row([
      "Time",
      "Pair",
      "Direction",
      "Mode",
      "V9 Layer",
      "Trade Amount",
      "Payout %",
      "Return",
      "Net P/L",
      "Signal Price",
      "Open Quote",
      "Close Quote",
      "Result",
      "Signal Type",
      "Grade",
    ]),
  );
  for (const j of journal) {
    lines.push(
      row([
        j.marked_time || j.created_at,
        j.pair,
        j.direction,
        j.scan_mode,
        j.v9_layer,
        j.trade_amount,
        j.payout_percent,
        j.return_amount,
        j.net_profit,
        j.signal_entry_price,
        j.olymp_opening_quote,
        j.olymp_closing_quote,
        j.result,
        j.signal_type,
        j.grade,
      ]),
    );
  }

  return lines.join("\n");
}
