import { requireAdminApi } from "@/lib/admin/guard";
import { parseAdminDateRange } from "@/lib/admin/dateRange";
import { userReportToCsv } from "@/lib/admin/reportCsv";
import { isRealTradeSignal } from "@/lib/analytics/winRate";
import { resolveUserAllowedPairs } from "@/lib/access/assetAccess";
import { getUserScanMetrics } from "@/lib/billing/scanMetrics";
import { num } from "@/lib/risk/capitalProtection";
import {
  buildRiskStatusPayload,
  checkCapitalColumnsReady,
  getDailyRiskSummariesInRange,
} from "@/lib/risk/dailyRiskSummary";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

function summaryByPair(
  rows: { pair: string; result: string; signal_type?: string | null; grade?: string | null }[],
) {
  const map = new Map<string, { wins: number; losses: number; total: number }>();
  for (const r of rows) {
    const acc = map.get(r.pair) || { wins: 0, losses: 0, total: 0 };
    if (r.result === "Win") acc.wins++;
    if (r.result === "Loss") acc.losses++;
    if (r.result === "Win" || r.result === "Loss") acc.total++;
    map.set(r.pair, acc);
  }
  let bestPair = "—";
  let worstPair = "—";
  let bestRate = -1;
  let worstRate = 2;
  for (const [pair, m] of map.entries()) {
    if (m.total < 1) continue;
    const rate = m.wins / m.total;
    if (rate > bestRate) {
      bestRate = rate;
      bestPair = pair;
    }
    if (rate < worstRate) {
      worstRate = rate;
      worstPair = pair;
    }
  }
  return { bestPair, worstPair };
}

const JOURNAL_SELECT =
  "pair,result,signal_type,grade,created_at,marked_time,direction,timeframe,scan_mode,trade_amount,payout_percent,return_amount,net_profit,signal_entry_price,olymp_opening_quote,olymp_closing_quote,v9_layer";

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { userId } = await context.params;
  const { searchParams } = new URL(request.url);
  const { from, to, fromIso, toIso } = parseAdminDateRange(searchParams);
  const resultFilter = searchParams.get("result") || "";
  const format = searchParams.get("format") || "json";

  const admin = createAdminClient();

  let journalQuery = admin
    .from("trade_journal")
    .select(JOURNAL_SELECT)
    .eq("user_id", userId)
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
    .order("created_at", { ascending: false });

  if (resultFilter) journalQuery = journalQuery.eq("result", resultFilter);

  const [
    { data: profile },
    { data: signals },
    { data: journal },
    { data: recentScans },
    { data: termsAcceptances },
    { data: usageInRange },
    capitalColumnsReady,
    riskPayload,
    dailySummaries,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id,email,full_name,role,plan,is_active,risk_disclaimer_accepted,created_at")
      .eq("id", userId)
      .maybeSingle(),
    admin
      .from("signals")
      .select("pair,signal_type,grade,created_at")
      .eq("user_id", userId)
      .gte("created_at", fromIso)
      .lte("created_at", toIso),
    journalQuery,
    admin
      .from("scan_sessions")
      .select("id,mode,pairs,timeframes,total_signals,provider_calls,cache_hits,created_at")
      .eq("user_id", userId)
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("user_terms_acceptance")
      .select("accepted_at,ip_address,user_agent,terms_id,terms_documents(version,title)")
      .eq("user_id", userId)
      .order("accepted_at", { ascending: false }),
    admin
      .from("usage_logs")
      .select("action,provider_calls,cache_hits")
      .eq("user_id", userId)
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .eq("action", "scan_market"),
    checkCapitalColumnsReady(userId),
    buildRiskStatusPayload(userId),
    getDailyRiskSummariesInRange(userId, from, to),
  ]);

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const allowedAssets = await resolveUserAllowedPairs(
    userId,
    (profile.plan || "free") as "free" | "starter" | "pro" | "admin",
  );

  const scanMetrics = await getUserScanMetrics(userId);

  const journalRows = journal || [];
  const wins = journalRows.filter((r) => r.result === "Win").length;
  const losses = journalRows.filter((r) => r.result === "Loss").length;
  const refunds = journalRows.filter((r) => r.result === "Refund").length;
  const pending = journalRows.filter((r) => r.result === "Pending").length;

  const eligible = journalRows.filter(
    (r) =>
      isRealTradeSignal(
        r.signal_type || null,
        r.grade || null,
        (r as { v9_layer?: string | null }).v9_layer ?? null,
      ) && (r.result === "Win" || r.result === "Loss"),
  );
  const eligibleWins = eligible.filter((r) => r.result === "Win").length;
  const realTradeWinRate = eligible.length ? Math.round((eligibleWins / eligible.length) * 100) : 0;

  const { bestPair, worstPair } = summaryByPair(journalRows);

  const totalTradeAmount = journalRows.reduce((a, r) => a + num(r.trade_amount), 0);
  const totalReturnAmount = journalRows.reduce((a, r) => a + num(r.return_amount), 0);
  const totalNetProfit = journalRows.reduce((a, r) => a + num(r.net_profit), 0);

  const scansInRange = (usageInRange || []).length;
  const providerCallsInRange = (usageInRange || []).reduce(
    (a, r) => a + Number(r.provider_calls || 0),
    0,
  );
  const cacheHitsInRange = (usageInRange || []).reduce(
    (a, r) => a + Number(r.cache_hits || 0),
    0,
  );

  const capitalProtection = riskPayload
    ? {
        startingCapital: riskPayload.profile.starting_capital,
        currentCapital: riskPayload.profile.current_capital,
        todayNetProfit: riskPayload.todayNetProfit,
        consecutiveLosses: riskPayload.consecutiveLosses,
        riskStatus: riskPayload.riskStatus,
        liveModeLocked: riskPayload.liveModeLocked,
        riskPerTradePercent: riskPayload.profile.risk_per_trade_percent,
        dailyProfitTargetPercent: riskPayload.profile.daily_profit_target_percent,
        dailyLossLimitPercent: riskPayload.profile.daily_loss_limit_percent,
        maxConsecutiveLosses: riskPayload.profile.max_consecutive_losses,
        recovery: riskPayload.recovery,
        columnsReady: capitalColumnsReady,
      }
    : null;

  const payload = {
    filter: { from, to, result: resultFilter || null },
    profile,
    allowedAssets,
    termsAcceptances: termsAcceptances || [],
    capitalProtection,
    dailySummaries: dailySummaries.map((d) => ({
      trade_date: d.trade_date,
      starting_capital: d.starting_capital,
      current_capital: d.current_capital,
      total_trades: d.total_trades,
      wins: d.wins,
      losses: d.losses,
      refunds: d.refunds,
      net_profit: d.net_profit,
      consecutive_losses: d.consecutive_losses,
      live_mode_locked: d.live_mode_locked,
    })),
    usage: {
      scansToday: scanMetrics.scansToday,
      totalScans: scanMetrics.totalScans,
      providerCalls: scanMetrics.providerCalls,
      cacheHits: scanMetrics.cacheHits,
      scansInRange,
      providerCallsInRange,
      cacheHitsInRange,
    },
    totals: {
      signalsGenerated: (signals || []).length,
      journalRows: journalRows.length,
      wins,
      losses,
      refunds,
      pending,
      realTradeWinRate,
      observationAccuracy: realTradeWinRate,
      bestPair,
      worstPair,
      totalTradeAmount,
      totalReturnAmount,
      totalNetProfit,
    },
    recentScans: recentScans || [],
    recentJournal: journalRows.slice(0, 100),
    journalEntries: journalRows.slice(0, 200),
  };

  if (format === "csv") {
    const csv = userReportToCsv({
      ...payload,
      filter: { from, to, result: resultFilter || undefined },
    });
    const safeEmail = (profile.email || userId).replace(/[^a-zA-Z0-9_-]/g, "_");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="user_report_${safeEmail}_${from}_${to}.csv"`,
      },
    });
  }

  return NextResponse.json(payload);
}
