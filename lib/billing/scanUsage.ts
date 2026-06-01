import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanName } from "./planLimits";
import { getPlanLimits } from "./planLimits";

function startOfUtcDay() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

export async function getScansUsedToday(userId: string): Promise<number> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return 0;
  const admin = createAdminClient();
  const since = startOfUtcDay();
  const { count } = await admin
    .from("usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", "scan_market")
    .gte("created_at", since);
  return count ?? 0;
}

export async function canScanToday(userId: string, plan: PlanName): Promise<{
  allowed: boolean;
  scansUsedToday: number;
  dailyScanLimit: number;
  scansRemainingToday: number;
}> {
  const dailyScanLimit = getPlanLimits(plan).dailyScanLimit;
  const scansUsedToday = await getScansUsedToday(userId);
  const scansRemainingToday = Math.max(0, dailyScanLimit - scansUsedToday);
  return {
    allowed: scansUsedToday < dailyScanLimit,
    scansUsedToday,
    dailyScanLimit,
    scansRemainingToday,
  };
}
