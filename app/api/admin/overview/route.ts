import { requireApiAuth } from "@/lib/auth/apiAuth";
import { getProfileByUserId } from "@/lib/auth/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

function startOfUtcDayIso() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

export async function GET() {
  const { auth, error } = await requireApiAuth({ adminOnly: true });
  if (error) return error;

  const me = await getProfileByUserId(auth!.user.id);
  if (!me || me.role !== "admin" || me.is_active === false) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const dayStart = startOfUtcDayIso();

  const [
    { data: profiles, error: profilesError },
    { count: signalCount, error: signalError },
    { count: journalCount, error: journalError },
    { data: usageRows, error: usageError },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id, role, plan, is_active, risk_disclaimer_accepted"),
    admin.from("signals").select("id", { head: true, count: "exact" }),
    admin.from("trade_journal").select("id", { head: true, count: "exact" }),
    admin
      .from("usage_logs")
      .select("action,provider_calls,cache_hits")
      .gte("created_at", dayStart),
  ]);

  const apiError = profilesError || signalError || journalError || usageError;
  if (apiError) {
    return NextResponse.json({ error: apiError.message }, { status: 500 });
  }

  const allProfiles = profiles || [];
  const totals = {
    totalUsers: allProfiles.length,
    activeUsers: allProfiles.filter((p) => p.is_active !== false).length,
    suspendedUsers: allProfiles.filter((p) => p.is_active === false).length,
    adminUsers: allProfiles.filter((p) => p.role === "admin").length,
    freeUsers: allProfiles.filter((p) => p.plan === "free").length,
    starterUsers: allProfiles.filter((p) => p.plan === "starter").length,
    proUsers: allProfiles.filter((p) => p.plan === "pro").length,
    termsAcceptedUsers: allProfiles.filter((p) => p.risk_disclaimer_accepted === true).length,
    termsPendingUsers: allProfiles.filter((p) => p.risk_disclaimer_accepted !== true).length,
    totalSignalsGenerated: signalCount || 0,
    totalJournalRecords: journalCount || 0,
  };

  let totalScansToday = 0;
  let totalProviderCallsToday = 0;
  let totalCacheHitsToday = 0;
  for (const row of usageRows || []) {
    if (row.action === "scan_market") totalScansToday += 1;
    totalProviderCallsToday += Number(row.provider_calls || 0);
    totalCacheHitsToday += Number(row.cache_hits || 0);
  }

  return NextResponse.json({
    ...totals,
    totalScansToday,
    totalProviderCallsToday,
    totalCacheHitsToday,
  });
}
