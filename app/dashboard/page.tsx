import { DashboardClient, type ScanSettings } from "@/components/dashboard/DashboardClient";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { getAuthContext } from "@/lib/auth/session";
import { getProfileByUserId } from "@/lib/auth/profile";
import { canScanToday } from "@/lib/billing/scanUsage";
import { defaultLiveUpdateForPlan, getUserPlan } from "@/lib/billing/planLimits";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const profile = await getProfileByUserId(auth.user.id);
  const plan = getUserPlan(profile);
  const scanQuota = await canScanToday(auth.user.id, plan);

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const { count } = await supabase
    .from("usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", auth.user.id);

  const initialSettings: ScanSettings = {
    asset: "all",
    timeframe: settings?.default_timeframe || "5min",
    minScore: settings?.default_min_score || 5,
    showB: settings?.show_b_signals ?? true,
    session: "any",
    liveUpdate: defaultLiveUpdateForPlan(plan),
    mode: (settings?.default_mode as "practice" | "live") || "practice",
  };

  return (
    <ProtectedShell isAdmin={auth.isAdmin}>
      <DashboardClient
        initialSettings={initialSettings}
        configured={!!process.env.TWELVE_DATA_API_KEY}
        usageCount={count || 0}
        planInfo={{
          plan,
          scansUsedToday: scanQuota.scansUsedToday,
          scansRemainingToday: scanQuota.scansRemainingToday,
          dailyScanLimit: scanQuota.dailyScanLimit,
        }}
      />
    </ProtectedShell>
  );
}
