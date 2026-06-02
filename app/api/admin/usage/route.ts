import { requireAdminApi } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const admin = createAdminClient();
  const [users, signals, journal, usage, profiles] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("signals").select("id", { count: "exact", head: true }),
    admin.from("trade_journal").select("id", { count: "exact", head: true }),
    admin
      .from("usage_logs")
      .select("id,user_id,action,mode,created_at,metadata,provider_calls,cache_hits,estimated_provider_calls")
      .order("created_at", { ascending: false })
      .limit(1000),
    admin.from("profiles").select("id,plan"),
  ]);

  const usageRows = usage.data || [];
  const byUser: Record<string, { scans: number; provider: number; cache: number }> = {};
  const byPair: Record<string, number> = {};
  const byTimeframe: Record<string, number> = {};

  for (const row of usageRows) {
    const uid = row.user_id || "unknown";
    byUser[uid] = byUser[uid] || { scans: 0, provider: 0, cache: 0 };
    if (row.action === "scan_market") byUser[uid].scans += 1;
    byUser[uid].provider += Number(row.provider_calls || 0);
    byUser[uid].cache += Number(row.cache_hits || 0);

    const metadata = (row.metadata || {}) as Record<string, unknown>;
    const pairs = Array.isArray(metadata.pairs) ? metadata.pairs : [];
    const tfs = Array.isArray(metadata.timeframes) ? metadata.timeframes : [];
    for (const p of pairs) byPair[String(p)] = (byPair[String(p)] || 0) + 1;
    for (const t of tfs) byTimeframe[String(t)] = (byTimeframe[String(t)] || 0) + 1;
  }

  const planByUser = new Map((profiles.data || []).map((p) => [p.id, p.plan || "free"]));
  const byPlan: Record<string, { scans: number; provider: number; cache: number }> = {};
  Object.entries(byUser).forEach(([uid, v]) => {
    const plan = String(planByUser.get(uid) || "free");
    byPlan[plan] = byPlan[plan] || { scans: 0, provider: 0, cache: 0 };
    byPlan[plan].scans += v.scans;
    byPlan[plan].provider += v.provider;
    byPlan[plan].cache += v.cache;
  });

  const totals = usageRows.reduce(
    (acc, r) => {
      if (r.action === "scan_market") acc.scans += 1;
      acc.provider += Number(r.provider_calls || 0);
      acc.cache += Number(r.cache_hits || 0);
      acc.estimated += Number(r.estimated_provider_calls || 0);
      return acc;
    },
    { scans: 0, provider: 0, cache: 0, estimated: 0 }
  );

  return NextResponse.json({
    totalUsers: users.count || 0,
    signalsGenerated: signals.count || 0,
    journalRecords: journal.count || 0,
    usageLogs: usageRows.slice(0, 200),
    totals,
    byUser,
    byPair,
    byTimeframe,
    byPlan,
    providerLimitErrors: usageRows.filter((r) =>
      JSON.stringify(r.metadata || {}).toLowerCase().includes("api limit")
    ),
  });
}
