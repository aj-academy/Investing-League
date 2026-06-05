import { requireAdminApi } from "@/lib/admin/guard";
import { isRealTradeSignal } from "@/lib/analytics/winRate";
import { resolveUserAllowedPairs } from "@/lib/access/assetAccess";
import { getUserScanMetrics } from "@/lib/billing/scanMetrics";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

function summaryByPair(
  rows: { pair: string; result: string; signal_type?: string | null; grade?: string | null }[]
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

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { userId } = await context.params;
  const admin = createAdminClient();
  const [
    { data: profile },
    { data: signals },
    { data: journal },
    { data: recentScans },
    { data: termsAcceptances },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id,email,full_name,role,plan,is_active,risk_disclaimer_accepted,created_at")
      .eq("id", userId)
      .maybeSingle(),
    admin
      .from("signals")
      .select("pair,signal_type,grade,created_at")
      .eq("user_id", userId),
    admin
      .from("trade_journal")
      .select("pair,result,signal_type,grade,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    admin
      .from("scan_sessions")
      .select("id,mode,pairs,timeframes,total_signals,provider_calls,cache_hits,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("user_terms_acceptance")
      .select("accepted_at,ip_address,user_agent,terms_id,terms_documents(version,title)")
      .eq("user_id", userId)
      .order("accepted_at", { ascending: false }),
  ]);

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const allowedAssets = await resolveUserAllowedPairs(
    userId,
    (profile.plan || "free") as "free" | "starter" | "pro" | "admin"
  );

  const scanMetrics = await getUserScanMetrics(userId);

  const journalRows = journal || [];
  const wins = journalRows.filter((r) => r.result === "Win").length;
  const losses = journalRows.filter((r) => r.result === "Loss").length;
  const refunds = journalRows.filter((r) => r.result === "Refund").length;
  const pending = journalRows.filter((r) => r.result === "Pending").length;

  const eligible = journalRows.filter(
    (r) =>
      isRealTradeSignal(r.signal_type || null, r.grade || null) &&
      (r.result === "Win" || r.result === "Loss")
  );
  const eligibleWins = eligible.filter((r) => r.result === "Win").length;
  const realTradeWinRate = eligible.length ? Math.round((eligibleWins / eligible.length) * 100) : 0;

  const { bestPair, worstPair } = summaryByPair(journalRows);

  return NextResponse.json({
    profile,
    allowedAssets,
    termsAcceptances: termsAcceptances || [],
    usage: {
      scansToday: scanMetrics.scansToday,
      totalScans: scanMetrics.totalScans,
      providerCalls: scanMetrics.providerCalls,
      cacheHits: scanMetrics.cacheHits,
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
    },
    recentScans: recentScans || [],
    recentJournal: journalRows.slice(0, 20),
  });
}
