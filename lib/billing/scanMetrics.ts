import { createAdminClient } from "@/lib/supabase/admin";

/** UTC midnight — matches daily scan limit logic. */
export function startOfUtcDayIso() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

export type UserScanMetrics = {
  scansToday: number;
  totalScans: number;
  providerCalls: number;
  cacheHits: number;
};

/** Scan counts from scan_sessions (primary) with usage_logs fallback. */
export async function getUserScanMetrics(userId: string): Promise<UserScanMetrics> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { scansToday: 0, totalScans: 0, providerCalls: 0, cacheHits: 0 };
  }

  const admin = createAdminClient();
  const since = startOfUtcDayIso();

  const [
    { count: sessionTotal },
    { count: sessionToday },
    { data: sessions },
    { count: usageTotal },
    { count: usageToday },
    { data: usageRows },
  ] = await Promise.all([
    admin
      .from("scan_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    admin
      .from("scan_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since),
    admin.from("scan_sessions").select("provider_calls,cache_hits").eq("user_id", userId),
    admin
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("action", "scan_market"),
    admin
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("action", "scan_market")
      .gte("created_at", since),
    admin
      .from("usage_logs")
      .select("provider_calls,cache_hits")
      .eq("user_id", userId)
      .eq("action", "scan_market"),
  ]);

  const totalScans = Math.max(sessionTotal ?? 0, usageTotal ?? 0);
  const scansToday = Math.max(sessionToday ?? 0, usageToday ?? 0);

  const sessionProvider = (sessions || []).reduce((a, r) => a + Number(r.provider_calls || 0), 0);
  const sessionCache = (sessions || []).reduce((a, r) => a + Number(r.cache_hits || 0), 0);
  const usageProvider = (usageRows || []).reduce((a, r) => a + Number(r.provider_calls || 0), 0);
  const usageCache = (usageRows || []).reduce((a, r) => a + Number(r.cache_hits || 0), 0);

  return {
    scansToday,
    totalScans,
    providerCalls: Math.max(sessionProvider, usageProvider),
    cacheHits: Math.max(sessionCache, usageCache),
  };
}

/** Today's scan count for plan limits (scan_sessions primary). */
export async function getScansUsedToday(userId: string): Promise<number> {
  const metrics = await getUserScanMetrics(userId);
  return metrics.scansToday;
}

export type TodayUsageByUser = {
  scans_today: number;
  provider_calls_today: number;
  cache_hits_today: number;
};

/** Batch today's scan stats per user for admin tables. */
export async function getTodayScanCountsByUser(): Promise<Map<string, TodayUsageByUser>> {
  const result = new Map<string, TodayUsageByUser>();
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return result;

  const admin = createAdminClient();
  const since = startOfUtcDayIso();

  const [{ data: sessions }, { data: usageRows }] = await Promise.all([
    admin
      .from("scan_sessions")
      .select("user_id,provider_calls,cache_hits")
      .gte("created_at", since),
    admin
      .from("usage_logs")
      .select("user_id,action,provider_calls,cache_hits")
      .gte("created_at", since)
      .eq("action", "scan_market"),
  ]);

  const bump = (userId: string, scans: number, provider: number, cache: number) => {
    const acc = result.get(userId) || {
      scans_today: 0,
      provider_calls_today: 0,
      cache_hits_today: 0,
    };
    acc.scans_today += scans;
    acc.provider_calls_today += provider;
    acc.cache_hits_today += cache;
    result.set(userId, acc);
  };

  for (const row of sessions || []) {
    if (!row.user_id) continue;
    bump(row.user_id, 1, Number(row.provider_calls || 0), Number(row.cache_hits || 0));
  }

  const usageByUser = new Map<string, TodayUsageByUser>();
  for (const row of usageRows || []) {
    if (!row.user_id) continue;
    const acc = usageByUser.get(row.user_id) || {
      scans_today: 0,
      provider_calls_today: 0,
      cache_hits_today: 0,
    };
    acc.scans_today += 1;
    acc.provider_calls_today += Number(row.provider_calls || 0);
    acc.cache_hits_today += Number(row.cache_hits || 0);
    usageByUser.set(row.user_id, acc);
  }

  for (const [userId, usage] of usageByUser) {
    const session = result.get(userId) || {
      scans_today: 0,
      provider_calls_today: 0,
      cache_hits_today: 0,
    };
    result.set(userId, {
      scans_today: Math.max(session.scans_today, usage.scans_today),
      provider_calls_today: Math.max(session.provider_calls_today, usage.provider_calls_today),
      cache_hits_today: Math.max(session.cache_hits_today, usage.cache_hits_today),
    });
  }

  return result;
}

/** Platform-wide scan totals for today (admin overview). */
export async function getPlatformScanTotalsToday() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { totalScansToday: 0, totalProviderCallsToday: 0, totalCacheHitsToday: 0 };
  }

  const admin = createAdminClient();
  const since = startOfUtcDayIso();

  const [{ count: sessionCount, data: sessions }, { count: usageCount, data: usageRows }] =
    await Promise.all([
      admin
        .from("scan_sessions")
        .select("provider_calls,cache_hits", { count: "exact" })
        .gte("created_at", since),
      admin
        .from("usage_logs")
        .select("provider_calls,cache_hits", { count: "exact" })
        .gte("created_at", since)
        .eq("action", "scan_market"),
    ]);

  const sessionProvider = (sessions || []).reduce((a, r) => a + Number(r.provider_calls || 0), 0);
  const sessionCache = (sessions || []).reduce((a, r) => a + Number(r.cache_hits || 0), 0);
  const usageProvider = (usageRows || []).reduce((a, r) => a + Number(r.provider_calls || 0), 0);
  const usageCache = (usageRows || []).reduce((a, r) => a + Number(r.cache_hits || 0), 0);

  return {
    totalScansToday: Math.max(sessionCount ?? 0, usageCount ?? 0),
    totalProviderCallsToday: Math.max(sessionProvider, usageProvider),
    totalCacheHitsToday: Math.max(sessionCache, usageCache),
  };
}

/** Platform-wide scan totals for a date range (admin overview). */
export async function getPlatformScanTotalsInRange(fromIso: string, toIso: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { scans: 0, providerCalls: 0, cacheHits: 0 };
  }

  const admin = createAdminClient();

  const [{ count: sessionCount, data: sessions }, { count: usageCount, data: usageRows }] =
    await Promise.all([
      admin
        .from("scan_sessions")
        .select("provider_calls,cache_hits", { count: "exact" })
        .gte("created_at", fromIso)
        .lte("created_at", toIso),
      admin
        .from("usage_logs")
        .select("provider_calls,cache_hits", { count: "exact" })
        .gte("created_at", fromIso)
        .lte("created_at", toIso)
        .eq("action", "scan_market"),
    ]);

  const sessionProvider = (sessions || []).reduce((a, r) => a + Number(r.provider_calls || 0), 0);
  const sessionCache = (sessions || []).reduce((a, r) => a + Number(r.cache_hits || 0), 0);
  const usageProvider = (usageRows || []).reduce((a, r) => a + Number(r.provider_calls || 0), 0);
  const usageCache = (usageRows || []).reduce((a, r) => a + Number(r.cache_hits || 0), 0);

  return {
    scans: Math.max(sessionCount ?? 0, usageCount ?? 0),
    providerCalls: Math.max(sessionProvider, usageProvider),
    cacheHits: Math.max(sessionCache, usageCache),
  };
}
