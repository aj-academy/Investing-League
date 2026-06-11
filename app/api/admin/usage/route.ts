import { requireAdminApi } from "@/lib/admin/guard";
import { parseAdminDateRange, utcDayKey } from "@/lib/admin/dateRange";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

type UsageAgg = { scans: number; provider: number; cache: number; estimated: number };

function bumpAgg(acc: UsageAgg, row: {
  action?: string | null;
  provider_calls?: number | null;
  cache_hits?: number | null;
  estimated_provider_calls?: number | null;
}) {
  if (row.action === "scan_market") acc.scans += 1;
  acc.provider += Number(row.provider_calls || 0);
  acc.cache += Number(row.cache_hits || 0);
  acc.estimated += Number(row.estimated_provider_calls || 0);
}

export async function GET(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const { from, to, fromIso, toIso } = parseAdminDateRange(searchParams);
  const userIdFilter = searchParams.get("userId") || "";
  const planFilter = searchParams.get("plan") || "";

  const admin = createAdminClient();

  let usageQuery = admin
    .from("usage_logs")
    .select(
      "id,user_id,action,mode,created_at,metadata,provider_calls,cache_hits,estimated_provider_calls"
    )
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (userIdFilter) usageQuery = usageQuery.eq("user_id", userIdFilter);

  const [users, signals, journal, usage, profiles] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("signals").select("id", { count: "exact", head: true }),
    admin.from("trade_journal").select("id", { count: "exact", head: true }),
    usageQuery,
    admin.from("profiles").select("id,plan,email,full_name"),
  ]);

  const usageRows = usage.data || [];
  const profileRows = profiles.data || [];
  const planByUser = new Map(profileRows.map((p) => [p.id, p.plan || "free"]));
  const emailByUser = new Map(profileRows.map((p) => [p.id, p.email || p.full_name || p.id]));

  const filteredRows = planFilter
    ? usageRows.filter((r) => planByUser.get(r.user_id || "") === planFilter)
    : usageRows;

  const byUser: Record<string, UsageAgg & { email?: string }> = {};
  const byPair: Record<string, number> = {};
  const byTimeframe: Record<string, number> = {};
  const byPlan: Record<string, UsageAgg> = {};
  const byDay: Record<string, UsageAgg> = {};

  for (const row of filteredRows) {
    const uid = row.user_id || "unknown";
    byUser[uid] = byUser[uid] || {
      scans: 0,
      provider: 0,
      cache: 0,
      estimated: 0,
      email: emailByUser.get(uid) || uid,
    };
    bumpAgg(byUser[uid], row);

    const plan = String(planByUser.get(uid) || "free");
    byPlan[plan] = byPlan[plan] || { scans: 0, provider: 0, cache: 0, estimated: 0 };
    bumpAgg(byPlan[plan], row);

    const day = utcDayKey(row.created_at);
    byDay[day] = byDay[day] || { scans: 0, provider: 0, cache: 0, estimated: 0 };
    bumpAgg(byDay[day], row);

    const metadata = (row.metadata || {}) as Record<string, unknown>;
    const pairs = Array.isArray(metadata.pairs) ? metadata.pairs : [];
    const tfs = Array.isArray(metadata.timeframes) ? metadata.timeframes : [];
    for (const p of pairs) byPair[String(p)] = (byPair[String(p)] || 0) + 1;
    for (const t of tfs) byTimeframe[String(t)] = (byTimeframe[String(t)] || 0) + 1;
  }

  const totals = filteredRows.reduce(
    (acc, r) => {
      bumpAgg(acc, r);
      return acc;
    },
    { scans: 0, provider: 0, cache: 0, estimated: 0 }
  );

  const byDaySorted = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  return NextResponse.json({
    filter: { from, to, userId: userIdFilter || null, plan: planFilter || null },
    totalUsers: users.count || 0,
    signalsGenerated: signals.count || 0,
    journalRecords: journal.count || 0,
    usageLogs: filteredRows.slice(0, 200),
    totals,
    byUser,
    byPair,
    byTimeframe,
    byPlan,
    byDay: byDaySorted,
    providerLimitErrors: filteredRows.filter((r) =>
      JSON.stringify(r.metadata || {}).toLowerCase().includes("api limit")
    ),
  });
}
