import { requireAdminApi } from "@/lib/admin/guard";
import { parseAdminDateRange } from "@/lib/admin/dateRange";
import { calculateRealWinRate } from "@/lib/analytics/winRate";
import {
  getPlatformScanTotalsInRange,
  getPlatformScanTotalsToday,
} from "@/lib/billing/scanMetrics";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const { from, to, fromIso, toIso } = parseAdminDateRange(searchParams);

  const admin = createAdminClient();

  const [
    { data: profiles, error: profilesError },
    { count: signalCountRange, error: signalError },
    { data: journalRows, error: journalError },
    scanTotalsRange,
    scanTotalsToday,
  ] = await Promise.all([
    admin.from("profiles").select("id, role, plan, is_active, risk_disclaimer_accepted"),
    admin
      .from("signals")
      .select("id", { head: true, count: "exact" })
      .gte("created_at", fromIso)
      .lte("created_at", toIso),
    admin
      .from("trade_journal")
      .select("result, signal_type, grade")
      .gte("created_at", fromIso)
      .lte("created_at", toIso),
    getPlatformScanTotalsInRange(fromIso, toIso),
    getPlatformScanTotalsToday(),
  ]);

  const apiError = profilesError || signalError || journalError;
  if (apiError) {
    return NextResponse.json({ error: apiError.message }, { status: 500 });
  }

  const allProfiles = profiles || [];
  const journal = journalRows || [];

  const wins = journal.filter((r) => r.result === "Win").length;
  const losses = journal.filter((r) => r.result === "Loss").length;
  const refunds = journal.filter((r) => r.result === "Refund").length;
  const pending = journal.filter((r) => r.result === "Pending").length;
  const decided = wins + losses;
  const winRate = decided ? Math.round((wins / decided) * 100) : 0;
  const realTrade = calculateRealWinRate(journal);

  return NextResponse.json({
    filter: { from, to },
    totalUsers: allProfiles.length,
    activeUsers: allProfiles.filter((p) => p.is_active !== false).length,
    suspendedUsers: allProfiles.filter((p) => p.is_active === false).length,
    adminUsers: allProfiles.filter((p) => p.role === "admin").length,
    freeUsers: allProfiles.filter((p) => p.plan === "free").length,
    starterUsers: allProfiles.filter((p) => p.plan === "starter").length,
    proUsers: allProfiles.filter((p) => p.plan === "pro").length,
    termsAcceptedUsers: allProfiles.filter((p) => p.risk_disclaimer_accepted === true).length,
    termsPendingUsers: allProfiles.filter((p) => p.risk_disclaimer_accepted !== true).length,
    range: {
      scans: scanTotalsRange.scans,
      providerCalls: scanTotalsRange.providerCalls,
      cacheHits: scanTotalsRange.cacheHits,
      signalsGenerated: signalCountRange || 0,
      journalRows: journal.length,
      wins,
      losses,
      refunds,
      pending,
      winRate,
      realTradeWins: realTrade.wins,
      realTradeLosses: realTrade.losses,
      realTradeTotal: realTrade.total,
      realTradeWinRate: realTrade.rate,
    },
    today: {
      scans: scanTotalsToday.totalScansToday,
      providerCalls: scanTotalsToday.totalProviderCallsToday,
      cacheHits: scanTotalsToday.totalCacheHitsToday,
    },
  });
}
